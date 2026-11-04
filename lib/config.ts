// Configuración leída de variables de entorno. Los price IDs de Stripe
// solo existen aquí (nunca escritos en el código).

export const SLUGS_CARTERA = ["conservadora", "moderada", "dinamica"] as const;
export type SlugCartera = (typeof SLUGS_CARTERA)[number];

const ENV_PRECIO: Record<SlugCartera, string> = {
  conservadora: "STRIPE_PRICE_CONSERVADORA",
  moderada: "STRIPE_PRICE_MODERADA",
  dinamica: "STRIPE_PRICE_DINAMICA",
};

export function nombreEnvPrecio(slug: string): string | undefined {
  return (ENV_PRECIO as Record<string, string>)[slug];
}

/** Price ID de Stripe para una cartera, o null si no está configurado. */
export function precioStripe(slug: string): string | null {
  const nombre = nombreEnvPrecio(slug);
  return (nombre && process.env[nombre]?.trim()) || null;
}

/** Cartera a la que corresponde un price ID, o null si no es de ninguna. */
export function carteraDePrecio(priceId: string): SlugCartera | null {
  return SLUGS_CARTERA.find((s) => precioStripe(s) === priceId) ?? null;
}

export function appUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Stripe Tax. Solo se activa con STRIPE_TAX_ENABLED=true, y solo debe activarse
 * cuando la cuenta tenga una dirección de sede y al menos un registro fiscal
 * activo en Stripe (sin registro, Stripe no cobra impuestos y no avisa).
 */
export function impuestosActivados(): boolean {
  return process.env.STRIPE_TAX_ENABLED === "true";
}

export function esProduccion(): boolean {
  return process.env.NODE_ENV === "production";
}
