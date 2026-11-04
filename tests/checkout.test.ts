// Pago: casilla obligatoria, registro de la aceptación y parámetros de Checkout.
import { afterAll, describe, expect, it } from "vitest";
import type Stripe from "stripe";
import { DISCLAIMER_ACEPTACION } from "../content/legal";
import { prisma } from "../lib/db";
import { crearSesionPortal, ErrorSuscripcion, iniciarCheckout } from "../lib/suscripciones";
import { cartera, crearUsuario } from "./ayudantes";

afterAll(() => prisma.$disconnect());

function stripeFalso() {
  const llamadas: { checkout: Stripe.Checkout.SessionCreateParams[]; opciones: unknown[]; clientes: number; portal: Stripe.BillingPortal.SessionCreateParams[] } =
    { checkout: [], opciones: [], clientes: 0, portal: [] };
  const stripe = {
    customers: { create: async () => ({ id: `cus_falso_${++llamadas.clientes}_${Math.random().toString(36).slice(2, 10)}` }) },
    checkout: {
      sessions: {
        create: async (p: Stripe.Checkout.SessionCreateParams, o: unknown) => {
          llamadas.checkout.push(p);
          llamadas.opciones.push(o);
          return { id: "cs_falsa", url: "https://checkout.stripe.test/c/pay/cs_falsa" };
        },
      },
    },
    billingPortal: {
      sessions: {
        create: async (p: Stripe.BillingPortal.SessionCreateParams) => {
          llamadas.portal.push(p);
          return { url: "https://billing.stripe.test/p/session" };
        },
      },
    },
  } as unknown as Stripe;
  return { stripe, llamadas };
}

const version = DISCLAIMER_ACEPTACION.version;

describe("casilla de aceptación", () => {
  it("sin marcar la casilla no se crea ningún pago ni se guarda nada", async () => {
    const { stripe, llamadas } = stripeFalso();
    const u = await crearUsuario();
    await expect(iniciarCheckout({ stripe, usuario: u, slug: "moderada", aceptaDisclaimer: false, versionTexto: version }))
      .rejects.toMatchObject({ codigo: "falta_aceptacion" });
    expect(llamadas.checkout).toHaveLength(0);
    expect(await prisma.aceptacionDisclaimer.count({ where: { usuarioId: u.id } })).toBe(0);
  });

  it("con una versión del texto distinta a la vigente se rechaza", async () => {
    const { stripe } = stripeFalso();
    const u = await crearUsuario();
    await expect(iniciarCheckout({ stripe, usuario: u, slug: "moderada", aceptaDisclaimer: true, versionTexto: "antigua" }))
      .rejects.toBeInstanceOf(ErrorSuscripcion);
  });

  it("al aceptar se guarda la aceptación con fecha, hora, cartera y versión del texto, antes del pago", async () => {
    const { stripe, llamadas } = stripeFalso();
    const u = await crearUsuario();
    const antes = new Date();
    const r = await iniciarCheckout({ stripe, usuario: u, slug: "dinamica", aceptaDisclaimer: true, versionTexto: version });

    const a = await prisma.aceptacionDisclaimer.findUniqueOrThrow({ where: { id: r.aceptacionId } });
    expect(a.usuarioId).toBe(u.id);
    expect(a.carteraId).toBe((await cartera("dinamica")).id);
    expect(a.versionTexto).toBe(version);
    expect(a.aceptadoEn.getTime()).toBeGreaterThanOrEqual(antes.getTime() - 1000);
    expect(llamadas.checkout[0].metadata?.aceptacion_id).toBe(a.id);
  });

  it("la aceptación no se puede modificar ni borrar después", async () => {
    const { stripe } = stripeFalso();
    const u = await crearUsuario();
    const { aceptacionId } = await iniciarCheckout({ stripe, usuario: u, slug: "moderada", aceptaDisclaimer: true, versionTexto: version });
    await expect(prisma.aceptacionDisclaimer.update({ where: { id: aceptacionId }, data: { versionTexto: "x" } })).rejects.toThrow(/inmutable/);
    await expect(prisma.aceptacionDisclaimer.delete({ where: { id: aceptacionId } })).rejects.toThrow(/inmutable/);
  });
});

describe("sesión de Checkout", () => {
  it("usa el precio de la variable de entorno y sigue las buenas prácticas de Stripe", async () => {
    const { stripe, llamadas, } = stripeFalso();
    const u = await crearUsuario();
    const r = await iniciarCheckout({ stripe, usuario: u, slug: "conservadora", aceptaDisclaimer: true, versionTexto: version });
    const p = llamadas.checkout[0];

    expect(r.url).toMatch(/^https:\/\/checkout\.stripe\.test\//);
    expect(p.mode).toBe("subscription");
    expect(p.line_items).toEqual([{ price: "price_test_conservadora", quantity: 1 }]);
    expect(p).not.toHaveProperty("payment_method_types");
    expect(p.client_reference_id).toBe(u.id);
    expect(p.customer).toMatch(/^cus_falso_/);
    expect(p.integration_identifier).toBeTruthy();
    expect(p.success_url).toContain("{CHECKOUT_SESSION_ID}");
    expect(p.subscription_data?.metadata?.cartera_slug).toBe("conservadora");
    expect(llamadas.opciones[0]).toEqual({ idempotencyKey: `checkout-${r.aceptacionId}` });

    // Se guarda el cliente de Stripe y se reutiliza en el siguiente pago.
    const guardado = await prisma.usuario.findUniqueOrThrow({ where: { id: u.id } });
    expect(guardado.stripeCustomerId).toBe(p.customer);
    await iniciarCheckout({ stripe, usuario: guardado, slug: "moderada", aceptaDisclaimer: true, versionTexto: version });
    expect(llamadas.clientes).toBe(1);
  });

  it("usa exactamente los parámetros configurados en Stripe Checkout Studio", async () => {
    const { stripe, llamadas } = stripeFalso();
    await iniciarCheckout({ stripe, usuario: await crearUsuario(), slug: "moderada", aceptaDisclaimer: true, versionTexto: version });
    expect(llamadas.checkout[0]).toMatchObject({
      ui_mode: "hosted_page",
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: false },
      allow_promotion_codes: false,
      payment_method_collection: "always",
      submit_type: "auto",
      integration_identifier: "hosted_web_0002",
      origin_context: "web",
    });
  });

  it("no permite pagar dos veces la misma cartera ni carteras inexistentes o sin precio", async () => {
    const { stripe } = stripeFalso();
    const u = await crearUsuario();
    await prisma.suscripcion.create({ data: { usuarioId: u.id, carteraId: (await cartera("moderada")).id, estado: "activa" } });
    await expect(iniciarCheckout({ stripe, usuario: u, slug: "moderada", aceptaDisclaimer: true, versionTexto: version }))
      .rejects.toMatchObject({ codigo: "ya_suscrito" });
    await expect(iniciarCheckout({ stripe, usuario: u, slug: "forex", aceptaDisclaimer: true, versionTexto: version }))
      .rejects.toMatchObject({ codigo: "cartera_no_existe" });

    const guardado = process.env.STRIPE_PRICE_DINAMICA;
    delete process.env.STRIPE_PRICE_DINAMICA;
    try {
      await expect(iniciarCheckout({ stripe, usuario: u, slug: "dinamica", aceptaDisclaimer: true, versionTexto: version }))
        .rejects.toMatchObject({ codigo: "precio_no_configurado" });
    } finally {
      process.env.STRIPE_PRICE_DINAMICA = guardado;
    }
  });
});

describe("portal del cliente", () => {
  it("abre la cancelación de una suscripción concreta del propio usuario", async () => {
    const { stripe, llamadas } = stripeFalso();
    const u = await crearUsuario({ stripeCustomerId: "cus_portal" });
    await prisma.suscripcion.create({
      data: { usuarioId: u.id, carteraId: (await cartera("dinamica")).id, estado: "activa", stripeSubscriptionId: "sub_portal" },
    });
    await crearSesionPortal({ stripe, usuario: u, cancelarSuscripcionId: "sub_portal" });
    expect(llamadas.portal[0].customer).toBe("cus_portal");
    expect(llamadas.portal[0].flow_data).toMatchObject({ type: "subscription_cancel", subscription_cancel: { subscription: "sub_portal" } });
  });

  it("no deja cancelar la suscripción de otra persona", async () => {
    const { stripe, llamadas } = stripeFalso();
    const otra = await crearUsuario({ stripeCustomerId: "cus_otra_persona" });
    await prisma.suscripcion.create({
      data: { usuarioId: otra.id, carteraId: (await cartera("moderada")).id, estado: "activa", stripeSubscriptionId: "sub_ajena" },
    });
    const yo = await crearUsuario({ stripeCustomerId: "cus_yo" });
    await expect(crearSesionPortal({ stripe, usuario: yo, cancelarSuscripcionId: "sub_ajena" })).rejects.toMatchObject({ codigo: "sin_suscripcion" });
    expect(llamadas.portal).toHaveLength(0);
  });
});
