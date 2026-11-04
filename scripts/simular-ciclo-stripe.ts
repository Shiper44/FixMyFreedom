// Herramienta de desarrollo (solo modo test): crea en Stripe una suscripción real
// para un usuario existente, como si hubiera pagado en Checkout, y opcionalmente
// la cancela. Genera eventos reales para probar el webhook.
//
//   npx tsx --env-file=.env scripts/simular-ciclo-stripe.ts <email> <slug> alta|cancelar-al-final|cancelar|impago
import { PrismaClient } from "@prisma/client";
import { precioStripe } from "../lib/config";
import { crearClienteStripe } from "../lib/stripe";

async function main() {
  const clave = process.env.STRIPE_SECRET_KEY ?? "";
  if (!/^(sk|rk)_test_/.test(clave)) throw new Error("Solo con claves de TEST.");
  const [email, slug, accion] = process.argv.slice(2);
  const prisma = new PrismaClient();
  const stripe = crearClienteStripe(clave);
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { email } });
  if (!usuario.stripeCustomerId) throw new Error("El usuario no tiene cliente de Stripe (inicia antes un pago desde la web)");
  const precio = precioStripe(slug);
  if (!precio) throw new Error(`Sin precio para ${slug}`);

  const suscripcionActual = async () =>
    (await stripe.subscriptions.list({ customer: usuario.stripeCustomerId!, price: precio, status: "all", limit: 1 })).data[0];

  if (accion === "alta" || accion === "impago") {
    const pm = await stripe.paymentMethods.attach(accion === "alta" ? "pm_card_visa" : "pm_card_chargeCustomerFail", {
      customer: usuario.stripeCustomerId,
    });
    const s = await stripe.subscriptions.create({
      customer: usuario.stripeCustomerId,
      items: [{ price: precio }],
      default_payment_method: pm.id,
      payment_behavior: accion === "alta" ? "error_if_incomplete" : "allow_incomplete",
      metadata: { usuario_id: usuario.id, cartera_slug: slug },
    });
    console.log(`Suscripción ${s.id}: ${s.status}`);
  } else if (accion === "cancelar-al-final") {
    const s = await stripe.subscriptions.update((await suscripcionActual()).id, { cancel_at_period_end: true });
    console.log(`Suscripción ${s.id}: cancela al final = ${s.cancel_at_period_end}`);
  } else if (accion === "cancelar") {
    const s = await stripe.subscriptions.cancel((await suscripcionActual()).id);
    console.log(`Suscripción ${s.id}: ${s.status}`);
  } else {
    throw new Error("Acción: alta | cancelar-al-final | cancelar | impago");
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exitCode = 1;
});
