import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { accionCerrarSesion } from "@/app/acciones";
import { Footer } from "@/components/Footer";
import { BotonPortal } from "@/components/Formularios";
import { Header } from "@/components/Header";
import { prisma } from "@/lib/db";
import { usuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };
export const dynamic = "force-dynamic";

const fecha = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" });
const NOMBRE_ESTADO = { activa: "Activa", impagada: "Pago pendiente", incompleta: "Pago sin completar", cancelada: "Cancelada" };

export default async function Cuenta({ searchParams }: { searchParams: Promise<{ pago?: string; cancelacion?: string }> }) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login?volver=/cuenta");
  const { pago, cancelacion } = await searchParams;

  const suscripciones = await prisma.suscripcion.findMany({
    where: { usuarioId: usuario.id },
    include: { cartera: { select: { slug: true, nombre: true, nivelRiesgo: true } } },
    orderBy: { cartera: { nivelRiesgo: "asc" } },
  });

  return (
    <>
      <Header solid conectado />
      <main id="contenido" className="page">
        <div className="wrap">
          <div className="page__head">
            <h1>Hola, {usuario.nombre}</h1>
            <p>Aquí tienes tus suscripciones. Cada una se gestiona y se cancela por separado.</p>
          </div>

          {pago === "completado" && (
            <p className="nota" role="status">
              Pago recibido. La suscripción aparecerá como activa en cuanto Stripe nos lo confirme, normalmente en unos segundos.
              Si no la ves, recarga la página.
            </p>
          )}
          {cancelacion === "solicitada" && (
            <p className="nota" role="status">Cancelación registrada. Mantienes el acceso hasta el final del periodo ya pagado.</p>
          )}

          {suscripciones.length === 0 ? (
            <div className="vacio">
              <h2 className="split__title">Todavía no tienes suscripciones</h2>
              <p>Compara las tres carteras modelo y suscríbete a las que quieras.</p>
              <p><Link className="crumb" href="/#precios">Ver las carteras</Link></p>
            </div>
          ) : (
            <ul className="cuenta__lista">
              {suscripciones.map((s) => (
                <li className="cuenta__item" key={s.id}>
                  <div>
                    <h3>
                      <Link href={`/carteras/${s.cartera.slug}`}>{s.cartera.nombre}</Link>
                      <span className={`estado estado--${s.estado}`}>{NOMBRE_ESTADO[s.estado]}</span>
                    </h3>
                    {s.estado === "activa" && s.periodoFinEn && (
                      <p>
                        {s.cancelaAlFinal
                          ? `Cancelada: tienes acceso hasta el ${fecha.format(s.periodoFinEn)}.`
                          : `Se renueva el ${fecha.format(s.periodoFinEn)}.`}
                      </p>
                    )}
                    {s.estado === "impagada" && <p>No hemos podido cobrar la última cuota. Actualiza el método de pago para recuperar el acceso.</p>}
                    {s.estado === "cancelada" && s.canceladaEn && <p>Terminó el {fecha.format(s.canceladaEn)}.</p>}
                  </div>
                  <div className="cuenta__acciones">
                    {s.estado !== "cancelada" && s.stripeSubscriptionId && !s.cancelaAlFinal && (
                      <BotonPortal texto="Cancelar esta suscripción" suscripcionId={s.stripeSubscriptionId} />
                    )}
                    {s.estado === "cancelada" && (
                      <Link className="btn btn--outline-dark" href={`/carteras/${s.cartera.slug}#suscripcion`}>Volver a suscribirme</Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="cuenta__pie">
            {usuario.stripeCustomerId && <BotonPortal texto="Facturas y método de pago" clase="btn btn--grape" />}
            <form action={accionCerrarSesion}>
              <button className="btn btn--outline-dark" type="submit">Cerrar sesión</button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
