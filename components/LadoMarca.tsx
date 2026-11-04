import Link from "next/link";
import { Icon } from "./Icons";

export function LadoMarca() {
  return (
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
  );
}
