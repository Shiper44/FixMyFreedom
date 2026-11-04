import type { Distribucion as D } from "@/lib/carteras";
import { formatearPct } from "@/lib/carteras";

// Distribución agregada por clase de activo (dato público).
export function Distribucion({ datos, light = false }: { datos: D; light?: boolean }) {
  if (datos.length === 0) return null;
  return (
    <div className={`dist${light ? " dist--light" : ""}`}>
      <div className="dist__bar" role="img" aria-label={datos.map((d) => `${d.nombre} ${formatearPct(d.pct)}`).join(", ")}>
        {datos.map((d) => (
          <span key={d.clase} className={`dist__seg c-${d.clase}`} style={{ width: `${d.pct}%` }} />
        ))}
      </div>
      <ul className="dist__legend">
        {datos.map((d) => (
          <li key={d.clase}>
            <span className={`sw c-${d.clase}`} aria-hidden="true" />
            {d.nombre}
            <span className="pct">{formatearPct(d.pct)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
