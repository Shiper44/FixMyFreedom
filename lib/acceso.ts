// Control de acceso al contenido de pago. Se comprueba SIEMPRE en el servidor.
import { prisma } from "./db";

/** Solo una suscripción en estado «activa» a ESA cartera da acceso a su contenido de pago. */
export async function tieneAccesoACartera(usuarioId: string | null | undefined, carteraId: string): Promise<boolean> {
  if (!usuarioId) return false;
  const s = await prisma.suscripcion.findUnique({
    where: { usuarioId_carteraId: { usuarioId, carteraId } },
    select: { estado: true },
  });
  return s?.estado === "activa";
}

/** Igual que tieneAccesoACartera pero a partir del slug. */
export async function tieneAccesoASlug(usuarioId: string | null | undefined, slug: string): Promise<boolean> {
  const c = await prisma.cartera.findUnique({ where: { slug }, select: { id: true } });
  return c ? tieneAccesoACartera(usuarioId, c.id) : false;
}
