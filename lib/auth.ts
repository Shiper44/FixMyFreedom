// Inicio de sesión sin contraseña: se envía por correo un enlace de un solo uso.
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./db";
import { appUrl } from "./config";
import { enviarCorreo } from "./email";

export const DURACION_TOKEN_MIN = 15;
export const DURACION_SESION_DIAS = 30;
export const MAX_ENLACES_POR_HORA = 5;

const hash = (t: string) => createHash("sha256").update(t).digest("hex");
const tokenAleatorio = () => randomBytes(32).toString("base64url");

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export type ResultadoSolicitud =
  | { ok: true; enlace: string }
  | { ok: false; error: "email_invalido" | "demasiados_intentos" | "falta_nombre" };

/** Crea un enlace de acceso y lo envía por correo. */
/** Ruta interna segura a la que volver tras entrar (evita redirecciones a otros dominios). */
export function rutaSegura(ruta: string | null | undefined): string {
  return ruta && ruta.startsWith("/") && !ruta.startsWith("//") && !ruta.includes("\\") ? ruta : "/cuenta";
}

export async function solicitarAcceso(
  emailBruto: string,
  nombreBruto?: string | null,
  volver?: string | null,
): Promise<ResultadoSolicitud> {
  const email = normalizarEmail(emailBruto);
  if (!emailValido(email)) return { ok: false, error: "email_invalido" };
  const nombre = nombreBruto?.trim() || null;

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (!existente && !nombre) return { ok: false, error: "falta_nombre" };

  const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000);
  const recientes = await prisma.tokenAcceso.count({ where: { email, creadoEn: { gte: haceUnaHora } } });
  if (recientes >= MAX_ENLACES_POR_HORA) return { ok: false, error: "demasiados_intentos" };

  const token = tokenAleatorio();
  await prisma.tokenAcceso.create({
    data: {
      email,
      nombre,
      tokenHash: hash(token),
      expiraEn: new Date(Date.now() + DURACION_TOKEN_MIN * 60 * 1000),
    },
  });

  const destino = rutaSegura(volver);
  const enlace =
    `${appUrl()}/login/verificar?token=${encodeURIComponent(token)}` +
    (destino !== "/cuenta" ? `&volver=${encodeURIComponent(destino)}` : "");
  await enviarCorreo({
    para: email,
    asunto: "Tu enlace para entrar en FixMyFreedom",
    texto: [
      `Hola${existente ? `, ${existente.nombre}` : nombre ? `, ${nombre}` : ""}:`,
      "",
      "Usa este enlace para entrar en FixMyFreedom. Caduca en 15 minutos y solo funciona una vez:",
      enlace,
      "",
      "Si no has pedido este enlace, ignora este correo.",
    ].join("\n"),
  });
  return { ok: true, enlace };
}

/** Comprueba un enlace de acceso, lo marca como usado y devuelve el usuario (lo crea si es nuevo). */
export async function consumirToken(token: string) {
  const ahora = new Date();
  // Marcado atómico: solo una petición puede consumir el token.
  const { count } = await prisma.tokenAcceso.updateMany({
    where: { tokenHash: hash(token), usadoEn: null, expiraEn: { gt: ahora } },
    data: { usadoEn: ahora },
  });
  if (count !== 1) return null;
  const t = await prisma.tokenAcceso.findUniqueOrThrow({ where: { tokenHash: hash(token) } });
  return prisma.usuario.upsert({
    where: { email: t.email },
    update: {},
    create: { email: t.email, nombre: t.nombre ?? t.email.split("@")[0] },
  });
}

export async function crearSesion(usuarioId: string): Promise<{ token: string; expiraEn: Date }> {
  const token = tokenAleatorio();
  const expiraEn = new Date(Date.now() + DURACION_SESION_DIAS * 24 * 60 * 60 * 1000);
  await prisma.sesion.create({ data: { usuarioId, tokenHash: hash(token), expiraEn } });
  return { token, expiraEn };
}

export async function usuarioDeSesion(token: string | undefined | null) {
  if (!token) return null;
  const s = await prisma.sesion.findUnique({ where: { tokenHash: hash(token) }, include: { usuario: true } });
  if (!s || s.expiraEn <= new Date()) return null;
  return s.usuario;
}

export async function cerrarSesion(token: string | undefined | null) {
  if (!token) return;
  await prisma.sesion.deleteMany({ where: { tokenHash: hash(token) } });
}
