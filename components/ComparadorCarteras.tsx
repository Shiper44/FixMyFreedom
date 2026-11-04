import Link from "next/link";
import type { CarteraResumen } from "@/lib/carteras";
import { formatearPrecio, ordenarPorRiesgo } from "@/lib/carteras";
import { Distribucion } from "./Distribucion";
import { RiskScale } from "./RiskScale";

// Comparador de carteras. Regla de cumplimiento: las tres se muestran
// en igualdad de condiciones (misma tarjeta, mismos botones, sin etiquetas
// ni destacados) y siempre en orden fijo de menor a mayor riesgo.
// Este componente NO recibe datos del usuario.
export function ComparadorCarteras({ carteras }: { carteras: CarteraResumen[] }) {
  return (
    <div className="plans">
      {ordenarPorRiesgo(carteras).map((c) => (
        <article className="plan" key={c.slug} data-cartera={c.slug}>
          <h3 className="plan__name">{c.nombre}</h3>
          <p className="plan__price">
            <span className="plan__amount">{formatearPrecio(c.precioCentimos)}</span> al mes
          </p>
          <RiskScale nivel={c.nivelRiesgo} />
          <dl className="plan__meta">
            <div><dt>Horizonte orientativo</dt><dd>{c.horizonte}</dd></div>
          </dl>
          <Distribucion datos={c.distribucion} />
          <p className="plan__desc">{c.descripcion}</p>
          <div className="plan__actions">
            <Link className="btn btn--light" href={`/carteras/${c.slug}`}>Ver la cartera</Link>
            <Link className="btn btn--outline" href={`/carteras/${c.slug}#suscripcion`}>Suscribirme</Link>
          </div>
        </article>
      ))}
    </div>
  );
}
