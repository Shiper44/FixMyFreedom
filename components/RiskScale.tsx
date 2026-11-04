// Nivel de riesgo en la escala 1-7.
export function RiskScale({ nivel, light = false }: { nivel: number; light?: boolean }) {
  return (
    <div className={`risk${light ? " risk--light" : ""}`} role="img" aria-label={`Nivel de riesgo ${nivel} de 7`}>
      <span className="risk__scale" aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className={`risk__bar${i < nivel ? " is-on" : ""}`} />
        ))}
      </span>
      <span className="risk__label" aria-hidden="true">Riesgo {nivel}</span>
      <span className="risk__num" aria-hidden="true">de 7</span>
    </div>
  );
}
