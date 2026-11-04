import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormularioAcceso } from "@/components/Formularios";
import { LadoMarca } from "@/components/LadoMarca";
import { rutaSegura } from "@/lib/auth";
import { usuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Iniciar sesión" };
export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const { volver } = await searchParams;
  if (await usuarioActual()) redirect(rutaSegura(volver));
  return (
    <div className="auth">
      <LadoMarca />
      <main className="auth__main" id="contenido">
        <div className="auth__card">
          <h2>Iniciar sesión</h2>
          <p>Te enviamos un enlace a tu correo para entrar, sin contraseña. Si es tu primera vez, se crea tu cuenta.</p>
          <FormularioAcceso volver={volver ? rutaSegura(volver) : undefined} />
          <p className="auth__alt">¿Todavía no conoces las carteras? <Link href="/#precios">Ver las carteras</Link></p>
          <Link className="auth__back" href="/">Volver a la página principal</Link>
        </div>
      </main>
    </div>
  );
}
