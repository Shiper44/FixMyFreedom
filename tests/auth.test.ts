// Inicio de sesión por enlace de un solo uso.
import { afterAll, describe, expect, it } from "vitest";
import { consumirToken, crearSesion, MAX_ENLACES_POR_HORA, rutaSegura, solicitarAcceso, usuarioDeSesion } from "../lib/auth";
import { prisma } from "../lib/db";
import { bandejaDeSalida } from "../lib/email";

afterAll(() => prisma.$disconnect());

const tokenDe = (enlace: string) => new URL(enlace).searchParams.get("token")!;

describe("enlace de acceso", () => {
  it("una persona nueva necesita nombre; con él se envía el enlace por correo", async () => {
    expect(await solicitarAcceso("nueva@ejemplo.test")).toEqual({ ok: false, error: "falta_nombre" });
    const r = await solicitarAcceso("  Nueva@Ejemplo.test ", "Alex");
    expect(r.ok).toBe(true);
    const correo = bandejaDeSalida.at(-1)!;
    expect(correo.para).toBe("nueva@ejemplo.test");
    expect(r.ok && correo.texto).toContain(r.ok ? r.enlace : "");
  });

  it("el enlace crea la cuenta y solo funciona una vez", async () => {
    const r = await solicitarAcceso("una-vez@ejemplo.test", "Sam");
    if (!r.ok) throw new Error("no esperado");
    const u = await consumirToken(tokenDe(r.enlace));
    expect(u?.email).toBe("una-vez@ejemplo.test");
    expect(u?.nombre).toBe("Sam");
    expect(await consumirToken(tokenDe(r.enlace))).toBeNull();
  });

  it("un enlace caducado o inventado no sirve", async () => {
    const r = await solicitarAcceso("caduca@ejemplo.test", "Noa");
    if (!r.ok) throw new Error("no esperado");
    await prisma.tokenAcceso.updateMany({ where: { email: "caduca@ejemplo.test" }, data: { expiraEn: new Date(Date.now() - 1000) } });
    expect(await consumirToken(tokenDe(r.enlace))).toBeNull();
    expect(await consumirToken("inventado")).toBeNull();
  });

  it("limita los enlaces por correo y hora", async () => {
    for (let i = 0; i < MAX_ENLACES_POR_HORA; i++) expect((await solicitarAcceso("limite@ejemplo.test", "Lu")).ok).toBe(true);
    expect(await solicitarAcceso("limite@ejemplo.test", "Lu")).toEqual({ ok: false, error: "demasiados_intentos" });
  });

  it("rechaza correos no válidos", async () => {
    expect(await solicitarAcceso("no-es-un-correo", "X")).toEqual({ ok: false, error: "email_invalido" });
  });
});

describe("sesiones", () => {
  it("una sesión válida identifica al usuario; una caducada no", async () => {
    const u = await prisma.usuario.create({ data: { email: "sesion@ejemplo.test", nombre: "Ari" } });
    const s = await crearSesion(u.id);
    expect((await usuarioDeSesion(s.token))?.id).toBe(u.id);
    await prisma.sesion.updateMany({ where: { usuarioId: u.id }, data: { expiraEn: new Date(Date.now() - 1000) } });
    expect(await usuarioDeSesion(s.token)).toBeNull();
    expect(await usuarioDeSesion(undefined)).toBeNull();
  });

  it("solo permite volver a rutas internas", () => {
    expect(rutaSegura("/carteras/moderada#suscripcion")).toBe("/carteras/moderada#suscripcion");
    expect(rutaSegura("https://otro.sitio")).toBe("/cuenta");
    expect(rutaSegura("//otro.sitio")).toBe("/cuenta");
    expect(rutaSegura("/\\otro.sitio")).toBe("/cuenta");
    expect(rutaSegura(undefined)).toBe("/cuenta");
  });
});
