// Crea en Stripe (modo test) los tres productos con su precio mensual en EUR
// y una configuración del portal del cliente. Es idempotente: se puede ejecutar
// varias veces sin duplicar nada (busca los precios por lookup_key).
//
//   npx tsx scripts/stripe-configurar.ts
//
// Al terminar imprime las variables de entorno que hay que añadir a .env.
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { CARTERAS_EJEMPLO } from "../prisma/datos-ejemplo";
import { EVENTOS_STRIPE } from "../lib/webhook-stripe";

// Código fiscal de Stripe para servicios prestados por vía electrónica.
// PENDIENTE de confirmar con el asesor fiscal.
const TAX_CODE = "txcd_10000000";

async function main() {
  const clave = process.env.STRIPE_SECRET_KEY;
  if (!clave?.startsWith("sk_test_") && !clave?.startsWith("rk_test_")) {
    throw new Error("Este script solo se ejecuta con una clave de TEST (sk_test_ o rk_test_).");
  }
  const stripe = new Stripe(clave);
  const prisma = new PrismaClient();
  const lineasEnv: string[] = [];

  for (const c of CARTERAS_EJEMPLO) {
    const lookupKey = `fmf_${c.slug}_mensual_eur`;
    const existentes = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    let precio = existentes.data[0];
    if (!precio) {
      const producto = await stripe.products.create({
        name: c.nombre,
        description: "Suscripción mensual a una cartera modelo genérica de FixMyFreedom. No constituye asesoramiento en materia de inversión.",
        tax_code: TAX_CODE,
        metadata: { cartera_slug: c.slug },
      });
      precio = await stripe.prices.create({
        product: producto.id,
        currency: "eur",
        unit_amount: c.precioCentimos,
        recurring: { interval: "month" },
        // Precio final con impuestos incluidos (habitual en venta a consumidores en la UE).
        tax_behavior: "inclusive",
        lookup_key: lookupKey,
        metadata: { cartera_slug: c.slug },
      });
      console.log(`Creado ${c.nombre}: ${precio.id}`);
    } else {
      console.log(`Ya existía ${c.nombre}: ${precio.id}`);
    }
    await prisma.cartera.updateMany({ where: { slug: c.slug }, data: { stripePriceId: precio.id } });
    lineasEnv.push(`${c.envPrecio}="${precio.id}"`);
  }

  // Portal del cliente: facturas, método de pago, datos de facturación y cancelación
  // al final del periodo. NO permite cambiar de cartera (cambiar de cartera exige
  // volver a marcar la casilla de aceptación).
  const portal = await stripe.billingPortal.configurations.create({
    business_profile: { headline: "Gestiona tus suscripciones a las carteras modelo de FixMyFreedom" },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      customer_update: { enabled: true, allowed_updates: ["email", "name", "address", "tax_id"] },
      subscription_cancel: { enabled: true, mode: "at_period_end", proration_behavior: "none" },
      subscription_update: { enabled: false },
    },
    metadata: { creado_por: "scripts/stripe-configurar.ts" },
  });
  lineasEnv.push(`STRIPE_PORTAL_CONFIGURATION="${portal.id}"`);

  console.log("\nAñade estas líneas a .env:\n");
  console.log(lineasEnv.join("\n"));
  console.log(`\nEventos que debe recibir el endpoint /api/stripe/webhook:\n  ${EVENTOS_STRIPE.join("\n  ")}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
