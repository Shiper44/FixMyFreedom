// Regla de cumplimiento: ninguna parte del sistema elige, sugiere, destaca u
// ordena una cartera en función de datos del usuario.
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, describe, expect, it } from "vitest";
import { ComparadorCarteras } from "../components/ComparadorCarteras";
import { prisma } from "../lib/db";
import { listarCarterasPublicas, obtenerCarteraPublica, ordenarPorRiesgo, type CarteraResumen } from "../lib/carteras";

const RAIZ = path.resolve(__dirname, "..");
const ORDEN_ESPERADO = ["conservadora", "moderada", "dinamica"];

afterAll(() => prisma.$disconnect());

function archivos(dir: string, ext = /\.(tsx?|md)$/): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? archivos(p, ext) : ext.test(f) ? [p] : [];
  });
}

describe("orden y presentación de las carteras", () => {
  it("las funciones públicas no aceptan datos del usuario", () => {
    expect(listarCarterasPublicas.length).toBe(0);
    expect(obtenerCarteraPublica.length).toBe(1); // solo el slug
    expect(ComparadorCarteras.length).toBeLessThanOrEqual(1); // solo props
  });

  it("listarCarterasPublicas devuelve siempre el orden fijo de menor a mayor riesgo", async () => {
    const a = await listarCarterasPublicas();
    const b = await listarCarterasPublicas();
    expect(a.map((c) => c.slug)).toEqual(ORDEN_ESPERADO);
    expect(b).toEqual(a);
    const niveles = a.map((c) => c.nivelRiesgo);
    expect([...niveles].sort((x, y) => x - y)).toEqual(niveles);
  });

  it("el orden no depende del orden de entrada", async () => {
    const lista = await listarCarterasPublicas();
    const barajadas = [[...lista].reverse(), [lista[1], lista[2], lista[0]], [lista[2], lista[0], lista[1]]];
    for (const l of barajadas) expect(ordenarPorRiesgo(l).map((c) => c.slug)).toEqual(ORDEN_ESPERADO);
  });

  it("el comparador muestra las tres tarjetas iguales, sin destacados, en orden fijo", async () => {
    const lista = await listarCarterasPublicas();
    const html = renderToStaticMarkup(ComparadorCarteras({ carteras: [...lista].reverse() as CarteraResumen[] }));

    const tarjetas = [...html.matchAll(/<article class="([^"]*)" data-cartera="([^"]+)"/g)];
    expect(tarjetas.map((m) => m[2])).toEqual(ORDEN_ESPERADO);
    expect(new Set(tarjetas.map((m) => m[1]))).toEqual(new Set(["plan"]));

    // Cada tarjeta tiene exactamente los mismos botones con las mismas clases.
    const bloques = html.split(/<article /).slice(1);
    const botones = bloques.map((b) => [...b.matchAll(/<a class="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m) => `${m[1]}|${m[2]}`));
    expect(botones[0]).toHaveLength(2);
    expect(botones[1]).toEqual(botones[0]);
    expect(botones[2]).toEqual(botones[0]);

    expect(html).not.toMatch(/recomendad|más elegid|ideal|para ti|tu perfil|badge|featured|destacad/i);
  });
});

describe("sin datos de perfil", () => {
  const schema = readFileSync(path.join(RAIZ, "prisma/schema.prisma"), "utf8");

  it("el modelo Usuario solo tiene datos de cuenta y de contacto", () => {
    const bloque = schema.match(/model Usuario \{([\s\S]*?)\n\}/)![1];
    const campos = bloque
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("//") && !l.startsWith("@@"))
      .map((l) => l.split(/\s+/)[0]);
    expect(campos.sort()).toEqual(
      [
        "id", "email", "nombre", "stripeCustomerId", "esAdmin", "creadoEn",
        "avisoWeb", "avisoEmail", "avisoWhatsapp", "avisoTelegram", "telefonoWhatsapp", "telegramChatId",
        "suscripciones", "aceptaciones", "notificaciones",
      ].sort(),
    );
  });

  it("no existe ningún modelo ni campo de cuestionario o perfil de riesgo", () => {
    const sinComentarios = schema.replace(/\/\/.*$/gm, "");
    expect(sinComentarios).not.toMatch(/cuestionario|perfil|edad|ingresos|patrimonio|tolerancia|objetivo|respuesta/i);
  });

  it("no hay pantallas de cuestionario ni de onboarding de riesgo", () => {
    const rutas = archivos(path.join(RAIZ, "app")).map((f) => path.relative(RAIZ, f));
    expect(rutas.filter((r) => /cuestionario|perfil|test-?riesgo|onboarding/i.test(r))).toEqual([]);
  });
});

describe("la parte pública no revela la composición", () => {
  it("ni el listado ni la ficha incluyen instrumentos ni ISIN", async () => {
    const posiciones = await prisma.carteraPosicion.findMany({ select: { isin: true, instrumento: true } });
    const publico = JSON.stringify([
      await listarCarterasPublicas(),
      ...(await Promise.all(ORDEN_ESPERADO.map((s) => obtenerCarteraPublica(s)))),
    ]);
    expect(publico).not.toMatch(/"isin"|"instrumento"/);
    for (const p of posiciones) {
      expect(publico).not.toContain(p.isin);
      expect(publico).not.toContain(p.instrumento);
    }
  });

  it("la distribución pública suma 100 %", async () => {
    for (const c of await listarCarterasPublicas()) {
      expect(c.distribucion.reduce((s, d) => s + d.pct, 0)).toBeCloseTo(100, 5);
    }
  });
});
