import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { usuarioActual } from "@/lib/sesion";
import { DOCUMENTOS, ESTADO_REVISION, documentoLegal } from "@/content/legal";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return DOCUMENTOS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = documentoLegal((await params).slug);
  return d ? { title: d.titulo } : {};
}

export default async function DocumentoLegalPage({ params }: Props) {
  const doc = documentoLegal((await params).slug);
  if (!doc) notFound();
  const conectado = Boolean(await usuarioActual());
  return (
    <>
      <Header solid conectado={conectado} />
      <main id="contenido" className="page">
        <div className="wrap legal-doc">
          <div className="page__head">
            <p className="legal-banner">{ESTADO_REVISION}</p>
            <h1>{doc.titulo}</h1>
          </div>
          {doc.secciones.map((s) => (
            <section key={s.titulo}>
              <h2>{s.titulo}</h2>
              {s.parrafos.map((p) => <p key={p}>{p}</p>)}
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
