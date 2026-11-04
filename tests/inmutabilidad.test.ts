import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../lib/db";

afterAll(() => prisma.$disconnect());

describe("versiones inmutables", () => {
  it("no se puede modificar ni borrar una posición de una versión publicada", async () => {
    const p = await prisma.carteraPosicion.findFirstOrThrow();
    await expect(prisma.carteraPosicion.update({ where: { id: p.id }, data: { pesoPct: 1 } })).rejects.toThrow(/inmutable/);
    await expect(prisma.carteraPosicion.delete({ where: { id: p.id } })).rejects.toThrow(/inmutable/);
  });

  it("no se puede modificar una versión", async () => {
    const v = await prisma.carteraVersion.findFirstOrThrow();
    await expect(prisma.carteraVersion.update({ where: { id: v.id }, data: { notaMetodologica: "x" } })).rejects.toThrow(/inmutable/);
  });

  it("cada versión de ejemplo suma 100 %", async () => {
    const versiones = await prisma.carteraVersion.findMany({ include: { posiciones: true } });
    for (const v of versiones) {
      expect(v.posiciones.reduce((s, p) => s + Number(p.pesoPct), 0)).toBeCloseTo(100, 5);
    }
  });
});
