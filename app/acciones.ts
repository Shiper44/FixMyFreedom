"use server";
// Acciones de servidor: inicio de sesión, pago y portal del cliente.
import { redirect } from "next/navigation";
import { cerrarSesion, consumirToken, crearSesion, rutaSegura, solicitarAcceso } from "@/lib/auth";
import { esProduccion } from "@/lib/config";
import { borrarCookieSesion, guardarCookieSesion, tokenSesionActual, usuarioActual } from "@/lib/sesion";
import { getStripe } from "@/lib/stripe";
import { crearSesionPortal, ErrorSuscripcion, iniciarCheckout } from "@/lib/suscripciones";

export type EstadoFormulario = { mensaje?: string; error?: string; enlaceDesarrollo?: string };

const ERRORES_ACCESO = {
  email_invalido: "Escribe un correo electrónico válido, por ejemplo nombre@dominio.com.",
  demasiados_intentos: "Has pedido demasiados enlaces. Espera una hora y vuelve a intentarlo.",
  falta_nombre: "Es la primera vez que entras con este correo: escribe también tu nombre para crear la cuenta.",
};

export async function accionSolicitarAcceso(_: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const r = await solicitarAcceso(
    String(datos.get("correo") ?? ""),
    String(datos.get("nombre") ?? ""),
    String(datos.get("volver") ?? ""),
  );
  if (!r.ok) return { error: ERRORES_ACCESO[r.error] };
  return {
    mensaje: "Te hemos enviado un enlace a tu correo. Ábrelo en los próximos 15 minutos para entrar.",
    // Sin proveedor de correo, en desarrollo se muestra el enlace en la propia página.
    enlaceDesarrollo: esProduccion() ? undefined : r.enlace,
  };
}

export async function accionConfirmarAcceso(_: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const usuario = await consumirToken(String(datos.get("token") ?? ""));
  if (!usuario) return { error: "El enlace ha caducado o ya se ha usado. Pide uno nuevo desde la página de inicio de sesión." };
  const sesion = await crearSesion(usuario.id);
  await guardarCookieSesion(sesion.token, sesion.expiraEn);
  redirect(rutaSegura(String(datos.get("volver") ?? "")));
}

export async function accionCerrarSesion() {
  await cerrarSesion(await tokenSesionActual());
  await borrarCookieSesion();
  redirect("/");
}

const ERRORES_PAGO: Record<ErrorSuscripcion["codigo"], string> = {
  falta_aceptacion: "Para continuar, marca la casilla de aceptación.",
  cartera_no_existe: "Esta cartera no existe o no está disponible.",
  precio_no_configurado: "El pago de esta cartera todavía no está disponible.",
  ya_suscrito: "Ya tienes una suscripción a esta cartera. Puedes gestionarla desde tu cuenta.",
  sin_suscripcion: "No hemos encontrado esa suscripción en tu cuenta.",
};

export async function accionSuscribirse(_: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const usuario = await usuarioActual();
  const slug = String(datos.get("cartera") ?? "");
  if (!usuario) redirect(`/login?volver=${encodeURIComponent(`/carteras/${slug}#suscripcion`)}`);
  let url: string;
  try {
    ({ url } = await iniciarCheckout({
      stripe: getStripe(),
      usuario,
      slug,
      aceptaDisclaimer: datos.get("acepta") === "si",
      versionTexto: String(datos.get("version_texto") ?? ""),
    }));
  } catch (e) {
    if (e instanceof ErrorSuscripcion) return { error: ERRORES_PAGO[e.codigo] };
    console.error("[stripe] Error al crear el pago", e);
    return { error: "No hemos podido iniciar el pago. Inténtalo de nuevo en unos minutos." };
  }
  redirect(url);
}

export async function accionPortal(_: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  let url: string;
  try {
    url = await crearSesionPortal({
      stripe: getStripe(),
      usuario,
      cancelarSuscripcionId: String(datos.get("suscripcion") ?? "") || undefined,
    });
  } catch (e) {
    if (e instanceof ErrorSuscripcion) return { error: ERRORES_PAGO[e.codigo] };
    console.error("[stripe] Error al abrir el portal", e);
    return { error: "No hemos podido abrir la gestión de la suscripción. Inténtalo de nuevo en unos minutos." };
  }
  redirect(url);
}
