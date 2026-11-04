// Herramienta de desarrollo: reenvía al webhook local los eventos reales de Stripe
// (modo test) creados desde una fecha, firmados con STRIPE_WEBHOOK_SECRET.
// Sirve cuando no se puede usar `stripe listen`.
//
//   npx tsx --env-file=.env scripts/reenviar-eventos-stripe.ts <desde_unix> [url]
import { crearClienteStripe } from "../lib/stripe";
import { EVENTOS_STRIPE } from "../lib/webhook-stripe";

async function main() {
  const clave = process.env.STRIPE_SECRET_KEY ?? "";
  if (!/^(sk|rk)_test_/.test(clave)) throw new Error("Solo con claves de TEST.");
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secreto) throw new Error("Falta STRIPE_WEBHOOK_SECRET");
  const desde = Number(process.argv[2]);
  if (!desde) throw new Error("Indica la fecha de inicio en segundos Unix");
  const url = process.argv[3] ?? "http://localhost:3000/api/stripe/webhook";

  const stripe = crearClienteStripe(clave);
  const eventos = [];
  for await (const e of stripe.events.list({ created: { gte: desde }, limit: 100 })) {
    if ((EVENTOS_STRIPE as readonly string[]).includes(e.type)) eventos.push(e);
  }
  eventos.sort((a, b) => a.created - b.created);
  for (const e of eventos) {
    const payload = JSON.stringify(e);
    const firma = stripe.webhooks.generateTestHeaderString({ payload, secret: secreto });
    const r = await fetch(url, { method: "POST", headers: { "stripe-signature": firma, "content-type": "application/json" }, body: payload });
    console.log(`${e.type.padEnd(40)} ${r.status} ${await r.text()}`);
  }
  if (eventos.length === 0) console.log("No hay eventos nuevos.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
