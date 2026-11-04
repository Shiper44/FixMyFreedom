// Suscripciones: pago con Stripe Checkout, portal del cliente y sincronización
// del estado a partir de Stripe (que es la fuente de verdad).
import type Stripe from "stripe";
import type { EstadoSuscripcion, Usuario } from "@prisma/client";
import { DISCLAIMER_ACEPTACION } from "@/content/legal";
import { appUrl, carteraDePrecio, precioStripe } from "./config";
import { prisma } from "./db";
import { INTEGRACION_CHECKOUT } from "./stripe";

export class ErrorSuscripcion extends Error {
  constructor(
    public codigo:
      | "falta_aceptacion"
      | "cartera_no_existe"
      | "precio_no_configurado"
      | "ya_suscrito"
      | "sin_suscripcion",
  ) {
    super(codigo);
  }
}

/** Crea (o reutiliza) el cliente de Stripe del usuario. */
async function clienteStripe(stripe: Stripe, usuario: Usuario): Promise<string> {
  if (usuario.stripeCustomerId) return usuario.stripeCustomerId;
  const cliente = await stripe.customers.create(
    { email: usuario.email, name: usuario.nombre, metadata: { usuario_id: usuario.id } },
    { idempotencyKey: `cliente-${usuario.id}` },
  );
  await prisma.usuario.update({ where: { id: usuario.id }, data: { stripeCustomerId: cliente.id } });
  return cliente.id;
}

/**
 * Inicia el pago de una cartera. Antes de crear la sesión de Stripe, comprueba
 * en el servidor que la persona ha marcado la casilla y guarda la aceptación
 * con su fecha y hora y la versión del texto.
 */
export async function iniciarCheckout(params: {
  stripe: Stripe;
  usuario: Usuario;
  slug: string;
  aceptaDisclaimer: boolean;
  versionTexto: string;
}): Promise<{ url: string; aceptacionId: string }> {
  const { stripe, usuario, slug } = params;
  if (!params.aceptaDisclaimer || params.versionTexto !== DISCLAIMER_ACEPTACION.version) {
    throw new ErrorSuscripcion("falta_aceptacion");
  }
  const cartera = await prisma.cartera.findFirst({ where: { slug, activa: true } });
  if (!cartera) throw new ErrorSuscripcion("cartera_no_existe");
  const precio = precioStripe(slug);
  if (!precio) throw new ErrorSuscripcion("precio_no_configurado");

  const actual = await prisma.suscripcion.findUnique({
    where: { usuarioId_carteraId: { usuarioId: usuario.id, carteraId: cartera.id } },
  });
  if (actual && (actual.estado === "activa" || actual.estado === "impagada")) throw new ErrorSuscripcion("ya_suscrito");

  const aceptacion = await prisma.aceptacionDisclaimer.create({
    data: { usuarioId: usuario.id, carteraId: cartera.id, versionTexto: DISCLAIMER_ACEPTACION.version },
  });

  const cliente = await clienteStripe(stripe, usuario);
  const metadata = { usuario_id: usuario.id, cartera_slug: slug, aceptacion_id: aceptacion.id };

  const sesion = await stripe.checkout.sessions.create(
    {
      // Parámetros configurados en Stripe Checkout Studio (ver STRIPE_INTEGRATION_TODO.md).
      ui_mode: "hosted_page",
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: false },
      allow_promotion_codes: false,
      payment_method_collection: "always",
      submit_type: "auto",
      integration_identifier: INTEGRACION_CHECKOUT,
      origin_context: "web",
      // Parámetros propios de la integración.
      mode: "subscription",
      line_items: [{ price: precio, quantity: 1 }],
      success_url: `${appUrl()}/cuenta?pago=completado&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/carteras/${slug}#suscripcion`,
      // Necesarios para asociar el pago al usuario, a la cartera y a la aceptación
      // de la casilla previa al pago (lo usan los webhooks).
      customer: cliente,
      client_reference_id: usuario.id,
      metadata,
      subscription_data: { metadata },
    },
    { idempotencyKey: `checkout-${aceptacion.id}` },
  );
  if (!sesion.url) throw new Error("Stripe no ha devuelto la URL de Checkout");
  return { url: sesion.url, aceptacionId: aceptacion.id };
}

/**
 * Portal del cliente de Stripe. Con `stripeSubscriptionId` abre directamente la
 * cancelación de esa suscripción; sin él, abre el portal general (facturas y
 * método de pago). El portal NO permite cambiar de cartera: una cartera nueva
 * siempre pasa por la casilla de aceptación.
 */
export async function crearSesionPortal(params: {
  stripe: Stripe;
  usuario: Usuario;
  cancelarSuscripcionId?: string;
}): Promise<string> {
  const { stripe, usuario, cancelarSuscripcionId } = params;
  if (!usuario.stripeCustomerId) throw new ErrorSuscripcion("sin_suscripcion");
  if (cancelarSuscripcionId) {
    const propia = await prisma.suscripcion.findFirst({
      where: { usuarioId: usuario.id, stripeSubscriptionId: cancelarSuscripcionId },
    });
    if (!propia) throw new ErrorSuscripcion("sin_suscripcion");
  }
  const sesion = await stripe.billingPortal.sessions.create({
    customer: usuario.stripeCustomerId,
    return_url: `${appUrl()}/cuenta`,
    locale: "es",
    ...(process.env.STRIPE_PORTAL_CONFIGURATION ? { configuration: process.env.STRIPE_PORTAL_CONFIGURATION } : {}),
    ...(cancelarSuscripcionId
      ? {
          flow_data: {
            type: "subscription_cancel",
            subscription_cancel: { subscription: cancelarSuscripcionId },
            after_completion: { type: "redirect", redirect: { return_url: `${appUrl()}/cuenta?cancelacion=solicitada` } },
          },
        }
      : {}),
  });
  return sesion.url;
}

export function estadoDesdeStripe(status: Stripe.Subscription.Status): EstadoSuscripcion {
  switch (status) {
    case "active":
    case "trialing":
      return "activa";
    case "past_due":
    case "unpaid":
      return "impagada";
    case "canceled":
    case "incomplete_expired":
      return "cancelada";
    default:
      return "incompleta"; // incomplete, paused
  }
}

const fecha = (s: number | null | undefined) => (s ? new Date(s * 1000) : null);
const idDe = (x: string | { id: string } | null | undefined) => (typeof x === "string" ? x : x?.id ?? null);

/**
 * Copia en la base de datos el estado de una suscripción de Stripe.
 * Resuelve el usuario por el cliente de Stripe y la cartera por el precio;
 * los metadatos solo se usan como último recurso.
 */
export async function sincronizarSuscripcion(sub: Stripe.Subscription): Promise<"sincronizada" | "ignorada"> {
  const clienteId = idDe(sub.customer);
  const item = sub.items.data[0];
  const precioId = item?.price?.id;

  const usuario =
    (clienteId && (await prisma.usuario.findUnique({ where: { stripeCustomerId: clienteId } }))) ||
    (sub.metadata?.usuario_id && (await prisma.usuario.findUnique({ where: { id: sub.metadata.usuario_id } }))) ||
    null;
  const slug = (precioId && carteraDePrecio(precioId)) || null;
  const cartera =
    (slug && (await prisma.cartera.findUnique({ where: { slug } }))) ||
    (precioId && (await prisma.cartera.findUnique({ where: { stripePriceId: precioId } }))) ||
    null;
  if (!usuario || !cartera) return "ignorada";

  const datos = {
    stripeSubscriptionId: sub.id,
    estado: estadoDesdeStripe(sub.status),
    inicioEn: fecha(sub.start_date),
    periodoFinEn: fecha(item?.current_period_end),
    canceladaEn: fecha(sub.ended_at ?? sub.canceled_at),
    cancelaAlFinal: Boolean(sub.cancel_at_period_end || sub.cancel_at),
  };

  const porId = await prisma.suscripcion.findUnique({ where: { stripeSubscriptionId: sub.id } });
  if (porId) {
    await prisma.suscripcion.update({ where: { id: porId.id }, data: datos });
    return "sincronizada";
  }

  const existente = await prisma.suscripcion.findUnique({
    where: { usuarioId_carteraId: { usuarioId: usuario.id, carteraId: cartera.id } },
  });
  // Una suscripción antigua ya cancelada no debe pisar a una vigente.
  if (existente && existente.estado === "activa" && datos.estado !== "activa" && existente.stripeSubscriptionId) {
    return "ignorada";
  }
  await prisma.suscripcion.upsert({
    where: { usuarioId_carteraId: { usuarioId: usuario.id, carteraId: cartera.id } },
    update: datos,
    create: { usuarioId: usuario.id, carteraId: cartera.id, ...datos },
  });
  return "sincronizada";
}
