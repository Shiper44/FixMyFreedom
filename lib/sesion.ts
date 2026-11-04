// Acceso a la sesión desde páginas y acciones de servidor (lee la cookie).
import "server-only";
import { cookies } from "next/headers";
import { usuarioDeSesion } from "./auth";
import { esProduccion } from "./config";

export const COOKIE_SESION = "fmf_sesion";

export async function usuarioActual() {
  const c = await cookies();
  return usuarioDeSesion(c.get(COOKIE_SESION)?.value);
}

export async function guardarCookieSesion(token: string, expiraEn: Date) {
  const c = await cookies();
  c.set(COOKIE_SESION, token, { httpOnly: true, sameSite: "lax", secure: esProduccion(), path: "/", expires: expiraEn });
}

export async function tokenSesionActual() {
  return (await cookies()).get(COOKIE_SESION)?.value;
}

export async function borrarCookieSesion() {
  (await cookies()).delete(COOKIE_SESION);
}
