import Stripe from "stripe";

// Cliente de Stripe del servidor. La clave nunca llega al navegador.
let cliente: Stripe | null = null;

export function getStripe(): Stripe {
  if (cliente) return cliente;
  const clave = process.env.STRIPE_SECRET_KEY;
  if (!clave) throw new Error("Falta STRIPE_SECRET_KEY");
  cliente = new Stripe(clave, { appInfo: { name: "FixMyFreedom" } });
  return cliente;
}

/** Etiqueta del flujo de Checkout para distinguirlo en el panel de Stripe. */
export const INTEGRACION_CHECKOUT = "fmf-carteras-modelo-qhvtzrkm";
