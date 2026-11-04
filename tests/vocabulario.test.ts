// Revisa todos los textos de la web (páginas, componentes y textos legales)
// en busca de vocabulario prohibido: órdenes al usuario, "instrucciones",
// "tu plan", recomendaciones personalizadas y promesas de rentabilidad.
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = path.resolve(__dirname, "..");
const CARPETAS = ["app", "components", "content", "lib", "prisma/datos-ejemplo.ts"];

function archivos(p: string): string[] {
  if (!statSync(p).isDirectory()) return [p];
  return readdirSync(p).flatMap((f) => archivos(path.join(p, f))).filter((f) => /\.(tsx?|md)$/.test(f));
}

const PROHIBIDO: [RegExp, string][] = [
  [/\binstrucci[oó]n(es)?\b/i, "«instrucción»: usa «cambio en la cartera modelo»"],
  [/\b[oó]rden(es)? de (compra|venta)\b|\bórdenes?\b/i, "«orden/órdenes»"],
  [/\btu plan\b|\bplan (b[aá]sico|est[aá]ndar|premium)\b/i, "«tu plan» o nombres de planes antiguos"],
  [/\bdebes (comprar|vender|invertir|mantener)\b/i, "imperativo dirigido al usuario"],
  [/(?<![\wáéíóúñ])(compra|vende|mant[eé]n|invierte en|ejec[uú]ta(la|lo)?)(?![\wáéíóúñ-])/i, "imperativo dirigido al usuario"],
  [/recomendad[ao]s? para ti|tu cartera ideal|encaja con tu perfil|seg[uú]n tu perfil|adaptad[ao] a ti/i, "sugerencia personalizada"],
  [/\bm[aá]s elegid[ao]\b|\brecomendad[ao]\b/i, "destacar una cartera"],
  [/(?<!no\s(?:\S+\s){0,3})\bgarantiz\w*/i, "promesa o garantía de rentabilidad"],
  [/rentabilidad (asegurada|segura)|sin riesgo\b|ganancias? seguras?/i, "promesa de rentabilidad"],
];

// Textos literales: cadenas y texto JSX. Se ignoran comentarios e identificadores.
function textos(fuente: string): string[] {
  const sinComentarios = fuente.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
  const cadenas = [...sinComentarios.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g)].map((m) => m[2]);
  const jsx = [...sinComentarios.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]);
  return [...cadenas, ...jsx].filter((t) => /[a-záéíóúñ]{3,}\s/i.test(t));
}

describe("vocabulario de la web", () => {
  const ficheros = CARPETAS.flatMap((c) => archivos(path.join(RAIZ, c)));

  it("hay textos que revisar", () => {
    expect(ficheros.length).toBeGreaterThan(5);
  });

  it("no contiene vocabulario prohibido", () => {
    const fallos: string[] = [];
    for (const f of ficheros) {
      for (const t of textos(readFileSync(f, "utf8"))) {
        for (const [re, motivo] of PROHIBIDO) {
          if (re.test(t)) fallos.push(`${path.relative(RAIZ, f)}: ${motivo}\n    «${t.trim().slice(0, 140)}»`);
        }
      }
    }
    expect(fallos, fallos.join("\n")).toEqual([]);
  });

  it("detecta los textos antiguos (control del propio test)", () => {
    const antiguos = [
      "Te decimos qué comprar, qué vender y cuándo, según el plan que elijas. Recibes cada instrucción",
      "Ejecútala en tu bróker ",
      "El más elegido ",
      "¿Dudas sobre qué plan te encaja? Tu plan ",
      "Rentabilidad garantizada cada mes ",
    ];
    for (const t of antiguos) expect(PROHIBIDO.some(([re]) => re.test(t)), t).toBe(true);
    expect(PROHIBIDO.some(([re]) => re.test("Las rentabilidades pasadas no garantizan rentabilidades futuras."))).toBe(false);
  });
});
