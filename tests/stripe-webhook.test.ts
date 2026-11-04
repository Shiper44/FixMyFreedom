// Webhooks de Stripe: firma, idempotencia y sincronización de la tabla suscripciones.
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const suscripcionesEnStripe = new Map<string, Stripe.Subscription>();
vi.mock("@/lib/stripe", async () => {
  const { stripeDePrueba } = await import("./ayudantes");
  stripeDePrueba.subscriptions.retrieve = (async (id: string) => {
    const s = suscripcionesEnStripe.get(id);
    if (!s) throw new Error(`Suscripción ${id} no encontrada`);
    return s;
  }) as unknown as typeof stripeDePrueba.subscriptions.retrieve;
  return { getStripe: () => stripeDePrueba, INTEGRACION_CHECKOUT: "test" };
});

import { POST } from "../app/api/stripe/webhook/route";
import { prisma } from "../lib/db";
import { cartera, crearUsuario, evento, peticionFirmada, suscripcionStripe } from "./ayudantes";

afterAll(() => prisma.$disconnect());
beforeEach(() => suscripcionesEnStripe.clear());

async function enviar(ev: Stripe.Event) {
  const r = await POST(peticionFirmada(ev));
  return { status: r.status, cuerpo: await r.json() };
}

async function suscripcionDe(usuarioId: string, slug: string) {
  const c = await cartera(slug);
  return prisma.suscripcion.findUnique({ where: { usuarioId_carteraId: { usuarioId, carteraId: c.id } } });
}

describe("firma del webhook", () => {
  it("rechaza peticiones sin firma", async () => {
    const r = await POST(new Request("https://x.test", { method: "POST", body: "{}" }));
    expect(r.status).toBe(400);
  });

  it("rechaza firmas hechas con otro secreto", async () => {
    const r = await POST(peticionFirmada(evento("invoice.paid", { id: "in_1" }), "whsec_otro"));
    expect(r.status).toBe(400);
  });

  it("rechaza un cuerpo modificado después de firmar", async () => {
    const original = peticionFirmada(evento("invoice.paid", { id: "in_1" }));
    const alterada = new Request(original.url, {
      method: "POST",
      headers: original.headers,
      body: JSON.stringify(evento("customer.subscription.deleted", { id: "sub_x" })),
    });
    expect((await POST(alterada)).status).toBe(400);
  });
});

describe("checkout completado", () => {
  it("crea la suscripción activa del usuario y la cartera correctas", async () => {
    const u = await crearUsuario({ stripeCustomerId: "cus_alta_1" });
    suscripcionesEnStripe.set("sub_alta_1", suscripcionStripe({ id: "sub_alta_1", customer: "cus_alta_1", price: "price_test_moderada" }));

    const r = await enviar(evento("checkout.session.completed", { id: "cs_1", mode: "subscription", subscription: "sub_alta_1", customer: "cus_alta_1" }));
    expect(r).toEqual({ status: 200, cuerpo: { recibido: true, resultado: "procesado" } });

    const s = await suscripcionDe(u.id, "moderada");
    expect(s?.estado).toBe("activa");
    expect(s?.stripeSubscriptionId).toBe("sub_alta_1");
    expect(s?.periodoFinEn).toBeInstanceOf(Date);
    expect(await suscripcionDe(u.id, "conservadora")).toBeNull();
    expect(await suscripcionDe(u.id, "dinamica")).toBeNull();
  });

  it("un mismo evento recibido dos veces solo se procesa una vez", async () => {
    await crearUsuario({ stripeCustomerId: "cus_dup" });
    suscripcionesEnStripe.set("sub_dup", suscripcionStripe({ id: "sub_dup", customer: "cus_dup", price: "price_test_dinamica" }));
    const ev = evento("checkout.session.completed", { id: "cs_dup", mode: "subscription", subscription: "sub_dup" });
    expect((await enviar(ev)).cuerpo.resultado).toBe("procesado");
    expect((await enviar(ev)).cuerpo.resultado).toBe("duplicado");
    expect(await prisma.suscripcion.count({ where: { stripeSubscriptionId: "sub_dup" } })).toBe(1);
  });

  it("ignora pagos únicos y precios que no son de ninguna cartera", async () => {
    await crearUsuario({ stripeCustomerId: "cus_otro" });
    expect((await enviar(evento("checkout.session.completed", { id: "cs_p", mode: "payment", subscription: null }))).cuerpo.resultado).toBe("ignorado");
    suscripcionesEnStripe.set("sub_otro", suscripcionStripe({ id: "sub_otro", customer: "cus_otro", price: "price_desconocido" }));
    const r = await enviar(evento("checkout.session.completed", { id: "cs_o", mode: "subscription", subscription: "sub_otro" }));
    expect(r.cuerpo.resultado).toBe("ignorado");
    expect(await prisma.suscripcion.count({ where: { stripeSubscriptionId: "sub_otro" } })).toBe(0);
  });

  it("ignora clientes que no existen en la base de datos", async () => {
    suscripcionesEnStripe.set("sub_nadie", suscripcionStripe({ id: "sub_nadie", customer: "cus_nadie", price: "price_test_moderada" }));
    const r = await enviar(evento("checkout.session.completed", { id: "cs_n", mode: "subscription", subscription: "sub_nadie" }));
    expect(r).toEqual({ status: 200, cuerpo: { recibido: true, resultado: "ignorado" } });
  });
});

describe("ciclo de vida de la suscripción", () => {
  it("actualizada, pago fallido, pago recuperado, cancelación programada y cancelada", async () => {
    const u = await crearUsuario({ stripeCustomerId: "cus_ciclo" });
    const base = { id: "sub_ciclo", customer: "cus_ciclo", price: "price_test_conservadora" };
    suscripcionesEnStripe.set("sub_ciclo", suscripcionStripe(base));
    await enviar(evento("customer.subscription.created", { id: "sub_ciclo" }));
    expect((await suscripcionDe(u.id, "conservadora"))?.estado).toBe("activa");

    // Pago fallido: Stripe pasa la suscripción a past_due.
    suscripcionesEnStripe.set("sub_ciclo", suscripcionStripe({ ...base, status: "past_due" }));
    await enviar(evento("invoice.payment_failed", { id: "in_f", parent: { subscription_details: { subscription: "sub_ciclo" } } }));
    expect((await suscripcionDe(u.id, "conservadora"))?.estado).toBe("impagada");

    // Pago recuperado.
    suscripcionesEnStripe.set("sub_ciclo", suscripcionStripe(base));
    await enviar(evento("invoice.paid", { id: "in_ok", parent: { subscription_details: { subscription: "sub_ciclo" } } }));
    expect((await suscripcionDe(u.id, "conservadora"))?.estado).toBe("activa");

    // La persona cancela desde el portal: sigue activa hasta el final del periodo.
    suscripcionesEnStripe.set("sub_ciclo", suscripcionStripe({ ...base, cancelaAlFinal: true }));
    await enviar(evento("customer.subscription.updated", { id: "sub_ciclo" }));
    const programada = await suscripcionDe(u.id, "conservadora");
    expect(programada?.estado).toBe("activa");
    expect(programada?.cancelaAlFinal).toBe(true);

    // Fin del periodo: Stripe la cancela.
    suscripcionesEnStripe.set("sub_ciclo", suscripcionStripe({ ...base, status: "canceled" }));
    await enviar(evento("customer.subscription.deleted", { id: "sub_ciclo" }));
    const cancelada = await suscripcionDe(u.id, "conservadora");
    expect(cancelada?.estado).toBe("cancelada");
    expect(cancelada?.canceladaEn).toBeInstanceOf(Date);
  });

  it("el estado final no depende del orden de llegada de los eventos", async () => {
    const u = await crearUsuario({ stripeCustomerId: "cus_orden" });
    // Stripe ya la tiene cancelada cuando llega, tarde, el evento de creación.
    suscripcionesEnStripe.set("sub_orden", suscripcionStripe({ id: "sub_orden", customer: "cus_orden", price: "price_test_moderada", status: "canceled" }));
    await enviar(evento("customer.subscription.deleted", { id: "sub_orden" }));
    await enviar(evento("customer.subscription.created", { id: "sub_orden" }));
    expect((await suscripcionDe(u.id, "moderada"))?.estado).toBe("cancelada");
  });

  it("cada cartera tiene su propia suscripción independiente", async () => {
    const u = await crearUsuario({ stripeCustomerId: "cus_varias" });
    for (const [sub, price] of [["sub_v1", "price_test_conservadora"], ["sub_v2", "price_test_dinamica"]]) {
      suscripcionesEnStripe.set(sub, suscripcionStripe({ id: sub, customer: "cus_varias", price }));
      await enviar(evento("customer.subscription.created", { id: sub }));
    }
    suscripcionesEnStripe.set("sub_v1", suscripcionStripe({ id: "sub_v1", customer: "cus_varias", price: "price_test_conservadora", status: "canceled" }));
    await enviar(evento("customer.subscription.deleted", { id: "sub_v1" }));
    expect((await suscripcionDe(u.id, "conservadora"))?.estado).toBe("cancelada");
    expect((await suscripcionDe(u.id, "dinamica"))?.estado).toBe("activa");
  });

  it("una suscripción nueva sustituye a una antigua ya cancelada de la misma cartera", async () => {
    const u = await crearUsuario({ stripeCustomerId: "cus_vuelve" });
    suscripcionesEnStripe.set("sub_vieja", suscripcionStripe({ id: "sub_vieja", customer: "cus_vuelve", price: "price_test_moderada", status: "canceled" }));
    await enviar(evento("customer.subscription.deleted", { id: "sub_vieja" }));
    suscripcionesEnStripe.set("sub_nueva", suscripcionStripe({ id: "sub_nueva", customer: "cus_vuelve", price: "price_test_moderada" }));
    await enviar(evento("checkout.session.completed", { id: "cs_v", mode: "subscription", subscription: "sub_nueva" }));
    const s = await suscripcionDe(u.id, "moderada");
    expect(s?.estado).toBe("activa");
    expect(s?.stripeSubscriptionId).toBe("sub_nueva");
  });
});

describe("eventos de riesgo", () => {
  it("disputas, reembolsos y alertas de fraude quedan marcados para revisión manual", async () => {
    for (const tipo of ["charge.dispute.created", "charge.refunded", "radar.early_fraud_warning.created"]) {
      const ev = evento(tipo, { id: `obj_${tipo}` });
      expect((await enviar(ev)).cuerpo.resultado).toBe("revisar");
      const registrado = await prisma.stripeEvento.findUniqueOrThrow({ where: { id: ev.id } });
      expect(registrado.revisar).toBe(true);
    }
  });
});

describe("errores", () => {
  it("devuelve 500 si falla el procesado, para que Stripe reintente", async () => {
    await crearUsuario({ stripeCustomerId: "cus_err" });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const ev = evento("customer.subscription.updated", { id: "sub_que_no_existe" });
    expect((await enviar(ev)).status).toBe(500);
    // No queda marcado como procesado: el reintento de Stripe se procesará.
    expect(await prisma.stripeEvento.findUnique({ where: { id: ev.id } })).toBeNull();
    spy.mockRestore();
  });
});
