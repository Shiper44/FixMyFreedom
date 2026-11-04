// Control de acceso por cartera: solo una suscripción activa a ESA cartera da acceso.
import { afterAll, describe, expect, it } from "vitest";
import type { EstadoSuscripcion } from "@prisma/client";
import { tieneAccesoACartera, tieneAccesoASlug } from "../lib/acceso";
import { prisma } from "../lib/db";
import { cartera, crearUsuario } from "./ayudantes";

afterAll(() => prisma.$disconnect());

describe("acceso al contenido de pago", () => {
  it("sin sesión no hay acceso a ninguna cartera", async () => {
    for (const slug of ["conservadora", "moderada", "dinamica"]) {
      expect(await tieneAccesoASlug(null, slug)).toBe(false);
      expect(await tieneAccesoASlug(undefined, slug)).toBe(false);
    }
  });

  it("con sesión pero sin suscripción no hay acceso", async () => {
    const u = await crearUsuario();
    expect(await tieneAccesoASlug(u.id, "moderada")).toBe(false);
  });

  it("una suscripción activa da acceso solo a su cartera", async () => {
    const u = await crearUsuario();
    await prisma.suscripcion.create({ data: { usuarioId: u.id, carteraId: (await cartera("moderada")).id, estado: "activa" } });
    expect(await tieneAccesoASlug(u.id, "moderada")).toBe(true);
    expect(await tieneAccesoASlug(u.id, "conservadora")).toBe(false);
    expect(await tieneAccesoASlug(u.id, "dinamica")).toBe(false);
  });

  it.each<EstadoSuscripcion>(["incompleta", "impagada", "cancelada"])("una suscripción %s no da acceso", async (estado) => {
    const u = await crearUsuario();
    const c = await cartera("dinamica");
    await prisma.suscripcion.create({ data: { usuarioId: u.id, carteraId: c.id, estado } });
    expect(await tieneAccesoACartera(u.id, c.id)).toBe(false);
  });

  it("la suscripción de otra persona no da acceso", async () => {
    const otra = await crearUsuario();
    const c = await cartera("conservadora");
    await prisma.suscripcion.create({ data: { usuarioId: otra.id, carteraId: c.id, estado: "activa" } });
    const yo = await crearUsuario();
    expect(await tieneAccesoACartera(yo.id, c.id)).toBe(false);
  });

  it("cartera inexistente: sin acceso", async () => {
    const u = await crearUsuario();
    expect(await tieneAccesoASlug(u.id, "forex")).toBe(false);
  });
});
