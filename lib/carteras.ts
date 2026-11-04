// Consultas de la parte PÚBLICA de las carteras modelo.
//
// Reglas de cumplimiento que garantiza este módulo:
// - Ninguna función recibe datos del usuario: el resultado es el mismo para todos.
// - El orden es siempre fijo, de menor a mayor riesgo.
// - Nunca devuelve instrumentos concretos ni ISIN: solo la distribución agregada
//   por clase de activo. La composición completa es contenido de pago.
import type { ClaseActivo, Prisma } from "@prisma/client";
import { prisma } from "./db";

export const NOMBRE_CLASE: Record<ClaseActivo, string> = {
  renta_variable: "Renta variable",
  renta_fija: "Renta fija",
  monetario: "Monetario",
  materias_primas: "Materias primas",
  inmobiliario: "Inmobiliario cotizado",
};

export type Distribucion = { clase: ClaseActivo; nombre: string; pct: number }[];

export type CarteraResumen = {
  slug: string;
  nombre: string;
  descripcion: string;
  nivelRiesgo: number;
  horizonte: string;
  precioCentimos: number;
  distribucion: Distribucion;
};

export type CarteraPublica = CarteraResumen & {
  metodologia: string;
  ultimoCambioEn: Date | null;
  rentabilidades: { anio: number; pct: number; simulada: boolean }[];
};

/** Orden fijo para todo el mundo: de menor a mayor riesgo. */
export function ordenarPorRiesgo<T extends { nivelRiesgo: number; slug: string }>(carteras: T[]): T[] {
  return [...carteras].sort((a, b) => a.nivelRiesgo - b.nivelRiesgo || a.slug.localeCompare(b.slug));
}

const CAMPOS_PUBLICOS = {
  id: true,
  slug: true,
  nombre: true,
  descripcion: true,
  nivelRiesgo: true,
  horizonte: true,
  precioCentimos: true,
} satisfies Prisma.CarteraSelect;

async function versionVigenteId(carteraId: string, ahora: Date): Promise<string | null> {
  const v = await prisma.carteraVersion.findFirst({
    where: { carteraId, fechaVigencia: { lte: ahora } },
    orderBy: [{ fechaVigencia: "desc" }, { numero: "desc" }],
    select: { id: true },
  });
  return v?.id ?? null;
}

async function distribucion(carteraId: string, ahora: Date): Promise<Distribucion> {
  const versionId = await versionVigenteId(carteraId, ahora);
  if (!versionId) return [];
  const grupos = await prisma.carteraPosicion.groupBy({
    by: ["claseActivo"],
    where: { versionId },
    _sum: { pesoPct: true },
  });
  return grupos
    .map((g) => ({ clase: g.claseActivo, nombre: NOMBRE_CLASE[g.claseActivo], pct: Number(g._sum.pesoPct ?? 0) }))
    .sort((a, b) => b.pct - a.pct);
}

function resumen(c: Prisma.CarteraGetPayload<{ select: typeof CAMPOS_PUBLICOS }>, d: Distribucion): CarteraResumen {
  return {
    slug: c.slug,
    nombre: c.nombre,
    descripcion: c.descripcion,
    nivelRiesgo: c.nivelRiesgo,
    horizonte: c.horizonte,
    precioCentimos: c.precioCentimos,
    distribucion: d,
  };
}

/** Las tres carteras, en igualdad de condiciones. No admite parámetros a propósito. */
export async function listarCarterasPublicas(): Promise<CarteraResumen[]> {
  const ahora = new Date();
  const carteras = await prisma.cartera.findMany({
    where: { activa: true },
    orderBy: [{ nivelRiesgo: "asc" }, { orden: "asc" }],
    select: CAMPOS_PUBLICOS,
  });
  const lista = await Promise.all(carteras.map(async (c) => resumen(c, await distribucion(c.id, ahora))));
  return ordenarPorRiesgo(lista);
}

/** Ficha pública de una cartera. Sin instrumentos ni ISIN. */
export async function obtenerCarteraPublica(slug: string): Promise<CarteraPublica | null> {
  const ahora = new Date();
  const c = await prisma.cartera.findFirst({
    where: { slug, activa: true },
    select: {
      ...CAMPOS_PUBLICOS,
      metodologia: true,
      rentabilidades: { orderBy: { anio: "asc" }, select: { anio: true, rentabilidadPct: true, simulada: true } },
      cambios: { orderBy: { publicadoEn: "desc" }, take: 1, select: { publicadoEn: true } },
    },
  });
  if (!c) return null;
  return {
    ...resumen(c, await distribucion(c.id, ahora)),
    metodologia: c.metodologia,
    ultimoCambioEn: c.cambios[0]?.publicadoEn ?? null,
    rentabilidades: c.rentabilidades.map((r) => ({ anio: r.anio, pct: Number(r.rentabilidadPct), simulada: r.simulada })),
  };
}

export function formatearPrecio(centimos: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: centimos % 100 === 0 ? 0 : 2,
  }).format(centimos / 100);
}

export function formatearPct(n: number): string {
  return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(n)} %`;
}
