import Link from "next/link";
import { AVISOS, DOCUMENTOS, ESTADO_REVISION } from "@/content/legal";
import { Icon } from "./Icons";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <section className="disclaimer" aria-labelledby="disclaimer-title">
          <p className="legal-banner">{ESTADO_REVISION}</p>
          <h2 id="disclaimer-title">Aviso legal y de riesgos</h2>
          <p>{AVISOS.noRegulada}</p>
          <p>{AVISOS.contenidoGenerico} {AVISOS.decisionPropia}</p>
          <p>{AVISOS.rentabilidadPasada}</p>
          <ul className="footer__legal">
            {DOCUMENTOS.map((d) => (
              <li key={d.slug}><Link href={`/legal/${d.slug}`}>{d.titulo}</Link></li>
            ))}
          </ul>
        </section>

        <div className="footer__bottom">
          <Link className="brand" href="/" aria-label="FixMyFreedom, inicio">
            <Icon name="logo-m" className="brand__mark" />
            <span className="brand__name">FixMyFreedom</span>
          </Link>
          <ul className="footer__nav">
            <li><Link href="/#sobre-nosotros">Sobre nosotros</Link></li>
            <li><Link href="/#precios">Precios</Link></li>
            <li><Link href="/#contacto">Contacto</Link></li>
            <li><Link href="/login">Iniciar sesión</Link></li>
          </ul>
          <p className="footer__copy">© {new Date().getFullYear()} FixMyFreedom</p>
        </div>
      </div>
    </footer>
  );
}
