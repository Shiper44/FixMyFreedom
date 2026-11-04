// Procesado de eventos de Stripe. Cada evento se procesa una sola vez.
import type Stripe from "stripe";
import { prisma } from "./db";
import { sincronizarSuscripcion } from "./suscripciones";

/** Eventos a los que hay que suscribir el endpoint en Stripe. */
export const EVENTOS_STRIPE = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "invoice.paid",
  "invoice.payment_failed",
  "charge.refunded",
  "charge.dispute.created",
  "radar.early_fraud_warning.created",
] as const;

const REVISION_MANUAL = new Set(["charge.refunded", "charge.dispute.created", "radar.early_fraud_warning.created"]);

export type Resultado = "procesado" | "duplicado" | "ignorado" | "revisar";

const idDe = (x: string | { id: string } | null | undefined) => (typeof x === "string" ? x : x?.id ?? null);

function suscripcionDeFactura(inv: Stripe.Invoice): string | null {
  return idDe(inv.parent?.subscription_details?.subscription);
}

async function sincronizarPorId(stripe: Stripe, id: string | null): Promise<Resultado> {
  if (!id) return "ignorado";
  // Siempre se lee el estado actual en Stripe: así da igual el orden en que lleguen los eventos.
  const sub = await stripe.subscriptions.retrieve(id);
  return (await sincronizarSuscripcion(sub)) === "sincronizada" ? "procesado" : "ignorado";
}

export async function procesarEventoStripe(evento: Stripe.Event, stripe: Stripe): Promise<Resultado> {
  if (await prisma.stripeEvento.findUnique({ where: { id: evento.id } })) return "duplicado";

  let resultado: Resultado = "ignorado";
  let nota: string | null = null;

  switch (evento.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.async_payment_failed": {
      const s = evento.data.object;
      if (s.mode === "subscription") resultado = await sincronizarPorId(stripe, idDe(s.subscription));
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      resultado = await sincronizarPorId(stripe, evento.data.object.id);
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
      resultado = await sincronizarPorId(stripe, suscripcionDeFactura(evento.data.object));
      break;
    default:
      if (REVISION_MANUAL.has(evento.type)) {
        resultado = "revisar";
        nota = `Revisar en el panel de Stripe: ${evento.type} (${idDe(evento.data.object as { id: string })})`;
      }
  }

  await prisma.stripeEvento
    .create({ data: { id: evento.id, tipo: evento.type, revisar: resultado === "revisar", nota } })
    .catch((e: { code?: string }) => {
      if (e.code !== "P2002") throw e; // otro proceso lo registró a la vez: no pasa nada
    });
  return resultado;
}
