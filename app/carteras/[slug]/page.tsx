import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Distribucion } from "@/components/Distribucion";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RiskScale } from "@/components/RiskScale";
import { FormularioSuscripcion } from "@/components/Formularios";
import { AVISOS, DISCLAIMER_ACEPTACION } from "@/content/legal";
import { precioStripe } from "@/lib/config";
import { prisma } from "@/lib/db";
import { usuarioActual } from "@/lib/sesion";
import { formatearPct, formatearPrecio, obtenerCarteraPublica } from "@/lib/carteras";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await obtenerCarteraPublica((await params).slug);
  return c ? { title: c.nombre, description: c.descripcion } : {};
}

const fecha = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" });

export default async function FichaCartera({ params }: Props) {
  const c = await obtenerCarteraPublica((await params).slug);
  if (!c) notFound();
  const usuario = await usuarioActual();
  const suscripcion = usuario
    ? await prisma.suscripcion.findFirst({ where: { usuarioId: usuario.id, cartera: { slug: c.slug } } })
    : null;
  const vigente = suscripcion?.estado === "activa" || suscripcion?.estado === "impagada";
  const simulada = c.rentabilidades.some((r) => r.simulada);

  return (
    <>
      <Header solid conectado={Boolean(usuario)} />
      <main id="contenido" className="page">
        <div className="wrap">
          <div className="page__head">
            <Link className="crumb" href="/#precios">Las tres carteras</Link>
            <h1>{c.nombre}</h1>
            <p>{c.descripcion}</p>
          </div>

          <div className="ficha">
            <div>
              <section aria-labelledby="h-dist">
                <h2 id="h-dist">Distribución por clase de activo</h2>
                <p>Composición agregada vigente de la cartera modelo.</p>
                <Distribucion datos={c.distribucion} light />
              </section>

              <section aria-labelledby="h-met">
                <h2 id="h-met">Metodología</h2>
                <p>{c.metodologia}</p>
                {c.ultimoCambioEn && <p>Último cambio publicado: {fecha.format(c.ultimoCambioEn)}.</p>}
              </section>

              <section aria-labelledby="h-rent">
                <h2 id="h-rent">Rentabilidad histórica de la cartera modelo{simulada ? " (simulada)" : ""}</h2>
                <div className="tabla-wrap">
                  <table className="tabla">
                    <thead><tr><th scope="col">Año</th><th scope="col">Rentabilidad anual</th></tr></thead>
                    <tbody>
                      {c.rentabilidades.map((r) => (
                        <tr key={r.anio}>
                          <td>{r.anio}{r.simulada ? " (simulado)" : ""}</td>
                          <td>{r.pct > 0 ? "+" : ""}{formatearPct(r.pct)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {simulada && <p className="nota">{AVISOS.rentabilidadSimulada}</p>}
                <p className="nota">{AVISOS.rentabilidadPasada}</p>
              </section>

              <section aria-labelledby="h-comp">
                <h2 id="h-comp">Composición completa</h2>
                <div className="bloqueado">
                  <strong>Solo para personas suscritas a esta cartera</strong>
                  Instrumentos concretos con su ISIN y peso, histórico de cambios y avisos cada vez que la cartera modelo cambia.
                </div>
              </section>
            </div>

            <aside className="ficha__aside" id="suscripcion" aria-labelledby="h-sus">
              <h2 id="h-sus" className="plan__name">Suscripción</h2>
              <p className="plan__price"><span className="plan__amount">{formatearPrecio(c.precioCentimos)}</span> al mes</p>
              <RiskScale nivel={c.nivelRiesgo} />
              <dl className="plan__meta">
                <div><dt>Horizonte orientativo</dt><dd>{c.horizonte}</dd></div>
                <div><dt>Avisos</dt><dd>Web, WhatsApp, Telegram y correo</dd></div>
              </dl>
              <p className="plan__desc">{AVISOS.contenidoGenerico}</p>
              {vigente ? (
                <p className="aviso-cuenta">
                  Ya tienes una suscripción a esta cartera. <Link href="/cuenta">Gestionarla en tu cuenta</Link>
                </p>
              ) : !precioStripe(c.slug) ? (
                <p className="aviso-cuenta">El pago de esta cartera todavía no está disponible.</p>
              ) : usuario ? (
                <FormularioSuscripcion
                  slug={c.slug}
                  textoAceptacion={DISCLAIMER_ACEPTACION.texto}
                  versionTexto={DISCLAIMER_ACEPTACION.version}
                />
              ) : (
                <div className="plan__actions">
                  <Link className="btn btn--amber" href={`/login?volver=${encodeURIComponent(`/carteras/${c.slug}#suscripcion`)}`}>
                    Iniciar sesión para suscribirme
                  </Link>
                  <p className="aviso-cuenta">Si no tienes cuenta, se crea al entrar con tu correo.</p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
