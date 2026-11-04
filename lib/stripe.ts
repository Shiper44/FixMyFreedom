import Stripe from "stripe";

/**
 * Crea un cliente de Stripe. Si el servidor sale a internet a través de un proxy
 * (HTTPS_PROXY), usa el cliente basado en fetch, que respeta el proxy cuando Node
 * se arranca con NODE_USE_ENV_PROXY=1. Sin proxy, usa el cliente por defecto.
 */
export function crearClienteStripe(clave: string): Stripe {
  return new Stripe(clave, {
    appInfo: { name: "FixMyFreedom" },
    ...(process.env.HTTPS_PROXY || process.env.https_proxy ? { httpClient: Stripe.createFetchHttpClient() } : {}),
  });
}

// Cliente de Stripe del servidor. La clave nunca llega al navegador.
let cliente: Stripe | null = null;

export function getStripe(): Stripe {
  if (cliente) return cliente;
  const clave = process.env.STRIPE_SECRET_KEY;
  if (!clave) throw new Error("Falta STRIPE_SECRET_KEY");
  cliente = crearClienteStripe(clave);
  return cliente;
}

/** Etiqueta del flujo de Checkout para distinguirlo en el panel de Stripe. */
export const INTEGRACION_CHECKOUT = "fmf-carteras-modelo-qhvtzrkm";
