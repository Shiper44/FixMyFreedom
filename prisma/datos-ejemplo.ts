// DATOS DE EJEMPLO para desarrollo y demostración.
// Instrumentos, ISIN y rentabilidades son ficticios: los ISIN usan el prefijo
// "ZZ", que no corresponde a ningún país, para no confundirse con valores reales.
import type { ClaseActivo } from "@prisma/client";
import { completarIsin } from "../lib/isin";

type Posicion = { instrumento: string; isin: string; claseActivo: ClaseActivo; pesoPct: number };
type Version = { fechaVigencia: string; notaMetodologica: string; posiciones: Posicion[] };
type Cambio = { resumen: string; justificacion: string };

export type CarteraEjemplo = {
  slug: string;
  nombre: string;
  descripcion: string;
  nivelRiesgo: number;
  horizonte: string;
  metodologia: string;
  orden: number;
  precioCentimos: number;
  envPrecio: string;
  versiones: [Version, Version];
  cambio: Cambio;
  rentabilidades: Record<number, number>;
};

let n = 0;
const isin = () => completarIsin(`ZZEJ${String(++n).padStart(7, "0")}`);
const p = (instrumento: string, claseActivo: ClaseActivo, pesoPct: number): Posicion => ({
  instrumento: `${instrumento} (ejemplo)`,
  isin: isin(),
  claseActivo,
  pesoPct,
});

// Instrumentos compartidos entre versiones (mismo ISIN en v1 y v2).
const rfGob = p("Fondo indexado de bonos de gobierno de la zona euro", "renta_fija", 45);
const rfCorp = p("ETF de bonos corporativos europeos de alta calidad", "renta_fija", 25);
const mon = p("Fondo monetario en euros", "monetario", 20);
const rvGlobalC = p("ETF de renta variable global", "renta_variable", 10);

const rvGlobalM = p("ETF de renta variable global", "renta_variable", 35);
const rvEuropa = p("ETF de renta variable europea", "renta_variable", 15);
const rfAgg = p("ETF de bonos globales cubierto a euros", "renta_fija", 35);
const oro = p("ETC de oro físico", "materias_primas", 10);
const monM = p("Fondo monetario en euros", "monetario", 5);
const mpBroad = p("ETF de materias primas diversificado", "materias_primas", 5);

const rvMundo = p("ETF de renta variable mundial", "renta_variable", 40);
const rvEmerg = p("ETF de renta variable de mercados emergentes", "renta_variable", 15);
const accA = p("Acción de empresa tecnológica europea", "renta_variable", 10);
const accB = p("Acción de empresa industrial estadounidense", "renta_variable", 10);
const accC = p("Acción de empresa de consumo japonesa", "renta_variable", 5);
const reit = p("ETF inmobiliario cotizado global", "inmobiliario", 5);
const rfHy = p("ETF de bonos de alto rendimiento", "renta_fija", 10);
const mpD = p("ETF de materias primas diversificado", "materias_primas", 5);
const accD = p("Acción de empresa sanitaria suiza", "renta_variable", 5);

const con = (pos: Posicion, pesoPct: number): Posicion => ({ ...pos, pesoPct });

export const CARTERAS_EJEMPLO: CarteraEjemplo[] = [
  {
    slug: "conservadora",
    nombre: "Cartera Conservadora",
    descripcion:
      "Cartera modelo centrada en renta fija y activos monetarios, con una pequeña parte en renta variable global. Busca limitar las oscilaciones de valor.",
    nivelRiesgo: 2,
    horizonte: "3 años o más",
    metodologia:
      "Asignación estratégica fija por clase de activo, revisada cada trimestre. Se reajustan los pesos cuando una clase de activo se desvía más de 5 puntos de su objetivo. Solo fondos y ETF indexados de bajo coste y alta liquidez.",
    orden: 1,
    precioCentimos: 100,
    envPrecio: "STRIPE_PRICE_CONSERVADORA",
    versiones: [
      {
        fechaVigencia: "2026-01-02T09:00:00Z",
        notaMetodologica: "Composición inicial de la cartera modelo.",
        posiciones: [rfGob, rfCorp, mon, rvGlobalC],
      },
      {
        fechaVigencia: "2026-10-01T09:00:00Z",
        notaMetodologica: "Revisión trimestral: reajuste de pesos en renta fija y monetario.",
        posiciones: [con(rfGob, 40), con(rfCorp, 30), con(mon, 20), con(rvGlobalC, 10)],
      },
    ],
    cambio: {
      resumen:
        "La cartera modelo reduce el fondo de bonos de gobierno de la zona euro del 45 % al 40 % e incrementa el ETF de bonos corporativos europeos del 25 % al 30 %.",
      justificacion:
        "Revisión trimestral prevista en la metodología: la renta fija corporativa se había desviado de su peso objetivo.",
    },
    rentabilidades: { 2021: 1.8, 2022: -6.2, 2023: 4.1, 2024: 3.5, 2025: 2.9 },
  },
  {
    slug: "moderada",
    nombre: "Cartera Moderada",
    descripcion:
      "Cartera modelo equilibrada entre renta variable y renta fija, con una parte en materias primas para diversificar.",
    nivelRiesgo: 4,
    horizonte: "5 años o más",
    metodologia:
      "Asignación estratégica 50/35/15 (renta variable / renta fija / otros) con revisión trimestral. Los cambios de instrumento solo se producen por coste, liquidez o cambios en el índice de referencia.",
    orden: 2,
    precioCentimos: 250,
    envPrecio: "STRIPE_PRICE_MODERADA",
    versiones: [
      {
        fechaVigencia: "2026-01-02T09:00:00Z",
        notaMetodologica: "Composición inicial de la cartera modelo.",
        posiciones: [rvGlobalM, rvEuropa, rfAgg, oro, con(monM, 5)],
      },
      {
        fechaVigencia: "2026-10-01T09:00:00Z",
        notaMetodologica: "Revisión trimestral: incorporación de materias primas diversificadas.",
        posiciones: [rvGlobalM, rvEuropa, rfAgg, con(oro, 5), mpBroad, monM],
      },
    ],
    cambio: {
      resumen:
        "La cartera modelo incorpora un ETF de materias primas diversificado con un peso del 5 % y reduce el ETC de oro físico del 10 % al 5 %.",
      justificacion:
        "La metodología prevé diversificar el bloque de materias primas entre varios activos en lugar de concentrarlo en uno solo.",
    },
    rentabilidades: { 2021: 6.4, 2022: -11.8, 2023: 9.2, 2024: 8.1, 2025: 5.6 },
  },
  {
    slug: "dinamica",
    nombre: "Cartera Dinámica",
    descripcion:
      "Cartera modelo con mayoría de renta variable, incluidas acciones individuales, y menor peso en renta fija. Asume oscilaciones de valor más amplias. No incluye forex ni criptomonedas.",
    nivelRiesgo: 6,
    horizonte: "8 años o más",
    metodologia:
      "Núcleo de ETF de renta variable global complementado con acciones individuales seleccionadas por criterios cuantitativos de calidad y valoración. Revisión mensual. Excluye forex, criptomonedas y productos apalancados.",
    orden: 3,
    precioCentimos: 400,
    envPrecio: "STRIPE_PRICE_DINAMICA",
    versiones: [
      {
        fechaVigencia: "2026-01-02T09:00:00Z",
        notaMetodologica: "Composición inicial de la cartera modelo.",
        posiciones: [rvMundo, rvEmerg, accA, accB, accC, reit, rfHy, mpD],
      },
      {
        fechaVigencia: "2026-10-01T09:00:00Z",
        notaMetodologica: "Revisión mensual: sustitución de una acción individual.",
        posiciones: [rvMundo, rvEmerg, accA, accB, accD, reit, rfHy, mpD],
      },
    ],
    cambio: {
      resumen:
        "La cartera modelo elimina la acción de empresa de consumo japonesa (5 %) e incorpora la acción de empresa sanitaria suiza con el mismo peso.",
      justificacion:
        "En la revisión mensual, la acción eliminada dejó de cumplir el criterio de valoración de la metodología.",
    },
    rentabilidades: { 2021: 14.9, 2022: -17.5, 2023: 15.8, 2024: 13.2, 2025: 7.4 },
  },
];
