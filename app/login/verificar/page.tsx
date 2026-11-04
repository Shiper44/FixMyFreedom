import type { Metadata } from "next";
import Link from "next/link";
import { FormularioConfirmarAcceso } from "@/components/Formularios";
import { rutaSegura } from "@/lib/auth";
import { LadoMarca } from "@/components/LadoMarca";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

// El enlace del correo no inicia sesión por sí solo: hay que pulsar el botón.
// Así los programas que analizan enlaces en el correo no gastan el enlace.
export default async function Verificar({ searchParams }: { searchParams: Promise<{ token?: string; volver?: string }> }) {
  const { token, volver } = await searchParams;
  return (
    <div className="auth">
      <LadoMarca />
      <main className="auth__main" id="contenido">
        <div className="auth__card">
          <h2>Entrar</h2>
          {token ? (
            <>
              <p>Pulsa el botón para entrar en tu cuenta.</p>
              <FormularioConfirmarAcceso token={token} volver={volver ? rutaSegura(volver) : undefined} />
            </>
          ) : (
            <p>Este enlace no es válido. <Link href="/login">Pide uno nuevo</Link>.</p>
          )}
        </div>
      </main>
    </div>
  );
}
