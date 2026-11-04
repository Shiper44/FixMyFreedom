import type { Metadata } from "next";
import Link from "next/link";
import { Campo, DemoForm } from "@/components/DemoForm";
import { Icon } from "@/components/Icons";

export const metadata: Metadata = { title: "Iniciar sesión" };

// Solo visual por ahora. El acceso real llega en la fase 2.
export default function Login() {
  return (
    <div className="auth">
      <aside className="auth__side">
        <Icon name="logo-m" className="auth__mark" />
        <Link className="brand" href="/" aria-label="FixMyFreedom, inicio">
          <Icon name="logo-m" className="brand__mark" />
          <span className="brand__name">FixMyFreedom</span>
        </Link>
        <div className="auth__quote">
          <h1>Tus carteras modelo, en un solo sitio.</h1>
          <p>Consulta la composición de las carteras a las que te has suscrito, su histórico de cambios y los avisos recibidos.</p>
        </div>
      </aside>
      <main className="auth__main" id="contenido">
        <div className="auth__card">
          <h2>Iniciar sesión</h2>
          <p>Entra con el correo electrónico de tu cuenta.</p>
          <DemoForm className="auth__form" boton="Iniciar sesión" mensaje="Acceso de demostración: todavía no hay cuentas, así que no se ha iniciado sesión.">
            <Campo id="l-email" name="correo" label="Correo electrónico" type="email" autoComplete="email" />
            <Campo id="l-pass" name="contrasena" label="Contraseña" type="password" autoComplete="current-password" />
          </DemoForm>
          <p className="auth__alt">¿Todavía no tienes cuenta? <Link href="/#precios">Ver las carteras</Link></p>
          <Link className="auth__back" href="/">Volver a la página principal</Link>
        </div>
      </main>
    </div>
  );
}
