// Carga las tres carteras modelo con datos de ejemplo.
// Es idempotente: si una cartera ya existe, no la vuelve a crear.
import { PrismaClient } from "@prisma/client";
import { CARTERAS_EJEMPLO } from "./datos-ejemplo";

export async function sembrar(prisma: PrismaClient) {
  for (const c of CARTERAS_EJEMPLO) {
    const existente = await prisma.cartera.findUnique({ where: { slug: c.slug } });
    if (existente) continue;

    const suma = (i: 0 | 1) => c.versiones[i].posiciones.reduce((s, p) => s + p.pesoPct, 0);
    for (const i of [0, 1] as const) {
      if (Math.abs(suma(i) - 100) > 0.001) throw new Error(`${c.slug} v${i + 1}: los pesos suman ${suma(i)} %`);
    }

    const cartera = await prisma.cartera.create({
      data: {
        slug: c.slug,
        nombre: c.nombre,
        descripcion: c.descripcion,
        nivelRiesgo: c.nivelRiesgo,
        horizonte: c.horizonte,
        metodologia: c.metodologia,
        orden: c.orden,
        precioCentimos: c.precioCentimos,
        stripePriceId: process.env[c.envPrecio] || null,
        rentabilidades: {
          create: Object.entries(c.rentabilidades).map(([anio, r]) => ({
            anio: Number(anio),
            rentabilidadPct: r,
            simulada: true,
          })),
        },
      },
    });

    const versiones = [];
    for (const [i, v] of c.versiones.entries()) {
      versiones.push(
        await prisma.carteraVersion.create({
          data: {
            carteraId: cartera.id,
            numero: i + 1,
            fechaVigencia: new Date(v.fechaVigencia),
            notaMetodologica: v.notaMetodologica,
            posiciones: { create: v.posiciones },
          },
        }),
      );
    }

    await prisma.cambioCartera.create({
      data: {
        carteraId: cartera.id,
        versionAnteriorId: null,
        versionNuevaId: versiones[0].id,
        resumen: "Publicación de la composición inicial de la cartera modelo.",
        justificacion: "Inicio de la cartera modelo según su metodología.",
        publicadoEn: new Date(c.versiones[0].fechaVigencia),
      },
    });
    await prisma.cambioCartera.create({
      data: {
        carteraId: cartera.id,
        versionAnteriorId: versiones[0].id,
        versionNuevaId: versiones[1].id,
        resumen: c.cambio.resumen,
        justificacion: c.cambio.justificacion,
        publicadoEn: new Date(c.versiones[1].fechaVigencia),
      },
    });
  }
}

const esScript = process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/seed.ts");
if (esScript) {
  const prisma = new PrismaClient();
  sembrar(prisma)
    .then(() => console.log("Carteras de ejemplo cargadas."))
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
