import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { prisma } from "../lib/db";

export const stripeDePrueba = new Stripe("sk_test_ficticia_para_tests");

export async function crearUsuario(datos: { stripeCustomerId?: string } = {}) {
  const id = randomUUID().slice(0, 8);
  return prisma.usuario.create({
    data: { email: `persona-${id}@ejemplo.test`, nombre: `Persona ${id}`, stripeCustomerId: datos.stripeCustomerId ?? null },
  });
}

export async function cartera(slug: string) {
  return prisma.cartera.findUniqueOrThrow({ where: { slug } });
}

/** Suscripción de Stripe mínima con la forma de la API actual. */
export function suscripcionStripe(o: {
  id: string;
  customer: string;
  price: string;
  status?: Stripe.Subscription.Status;
  periodoFin?: number;
  cancelaAlFinal?: boolean;
  metadata?: Record<string, string>;
}): Stripe.Subscription {
  const ahora = Math.floor(Date.now() / 1000);
  return {
    id: o.id,
    object: "subscription",
    customer: o.customer,
    status: o.status ?? "active",
    start_date: ahora - 3600,
    canceled_at: o.status === "canceled" ? ahora : null,
    ended_at: o.status === "canceled" ? ahora : null,
    cancel_at: null,
    cancel_at_period_end: o.cancelaAlFinal ?? false,
    metadata: o.metadata ?? {},
    items: {
      object: "list",
      data: [{ id: `si_${o.id}`, price: { id: o.price }, current_period_end: o.periodoFin ?? ahora + 30 * 86400 }],
    },
  } as unknown as Stripe.Subscription;
}

let n = 0;
export function evento(type: string, object: Record<string, unknown>): Stripe.Event {
  return { id: `evt_test_${Date.now()}_${++n}`, object: "event", type, data: { object } } as unknown as Stripe.Event;
}

/** Petición POST firmada como lo haría Stripe. */
export function peticionFirmada(ev: Stripe.Event, secreto = process.env.STRIPE_WEBHOOK_SECRET!): Request {
  const payload = JSON.stringify(ev);
  const firma = stripeDePrueba.webhooks.generateTestHeaderString({ payload, secret: secreto });
  return new Request("https://fixmyfreedom.test/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": firma, "content-type": "application/json" },
    body: payload,
  });
}
