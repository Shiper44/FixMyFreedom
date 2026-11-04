import { ComparadorCarteras } from "@/components/ComparadorCarteras";
import { Campo, DemoForm } from "@/components/DemoForm";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icons";
import { AUTOR, AVISOS } from "@/content/legal";
import { listarCarterasPublicas } from "@/lib/carteras";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const carteras = await listarCarterasPublicas();

  return (
    <>
      <Header />
      <main id="contenido">
        <section className="hero" aria-labelledby="hero-title">
          <Icon name="logo-m" className="hero__mark" />
          <div className="hero__inner">
            <div className="hero__copy">
              <h1 id="hero-title" className="hero__title">Tres carteras modelo. Tú eliges cuál seguir.</h1>
              <p className="hero__lead">
                Publicamos tres carteras modelo con distinto nivel de riesgo. Si te suscribes a una, te avisamos cada
                vez que cambia: qué incorpora, qué reduce, qué elimina y por qué. Lo que hagas con tu dinero lo decides tú.
              </p>
              <div className="hero__actions">
                <a className="btn btn--amber" href="#precios">Comparar las carteras</a>
                <a className="btn btn--ghost" href="#sobre-nosotros">Cómo funciona</a>
              </div>
            </div>

            <div className="feed" aria-label="Ejemplos de avisos de cambio">
              <article className="notice" style={{ "--i": 0 } as React.CSSProperties}>
                <header className="notice__head">
                  <Icon name="i-send" className="notice__icon" />
                  <span>Telegram · Cartera Moderada</span>
                </header>
                <p className="notice__action"><span className="tag tag--alta">Incorpora</span> ETF de materias primas</p>
                <dl className="notice__data">
                  <div><dt>Peso en la cartera modelo</dt><dd>5 %</dd></div>
                </dl>
              </article>
              <article className="notice" style={{ "--i": 1 } as React.CSSProperties}>
                <header className="notice__head">
                  <Icon name="i-mail" className="notice__icon" />
                  <span>Correo electrónico · Cartera Conservadora</span>
                </header>
                <p className="notice__action"><span className="tag tag--ajuste">Reduce</span> Bonos de gobierno de la zona euro</p>
                <dl className="notice__data">
                  <div><dt>Peso</dt><dd>del 45 % al 40 %</dd></div>
                </dl>
              </article>
              <article className="notice" style={{ "--i": 2 } as React.CSSProperties}>
                <header className="notice__head">
                  <Icon name="i-chat" className="notice__icon" />
                  <span>WhatsApp · Cartera Dinámica</span>
                </header>
                <p className="notice__action"><span className="tag tag--baja">Elimina</span> Acción de empresa de consumo</p>
                <dl className="notice__data">
                  <div><dt>Peso anterior</dt><dd>5 %</dd></div>
                </dl>
              </article>
              <p className="feed__note">Ejemplos ficticios de avisos de cambio.</p>
            </div>
          </div>
        </section>

        <section className="channels" aria-labelledby="channels-title">
          <div className="wrap">
            <h2 id="channels-title" className="channels__title">Los avisos de cambio llegan donde prefieras</h2>
            <ul className="channels__list">
              <li><Icon name="i-web" />Web</li>
              <li><Icon name="i-chat" />WhatsApp</li>
              <li><Icon name="i-send" />Telegram</li>
              <li><Icon name="i-mail" />Correo electrónico</li>
            </ul>
          </div>
        </section>

        <section className="about" id="sobre-nosotros" aria-labelledby="about-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="about-title" className="section-title">Carteras modelo públicas, iguales para todos</h2>
              <p className="section-lead">
                FixMyFreedom publica tres carteras modelo genéricas elaboradas con una metodología pública. No sabemos
                nada de tu situación ni la tenemos en cuenta: todas las personas suscritas a una cartera reciben
                exactamente el mismo contenido y los mismos avisos. Tu dinero sigue en tu bróker y nunca lo tocamos.
              </p>
            </div>

            <ol className="steps">
              <li className="step">
                <span className="step__n" aria-hidden="true">1</span>
                <h3>Comparas las tres carteras</h3>
                <p>Nivel de riesgo, horizonte, distribución por clase de activo, metodología e histórico. Todo es público.</p>
              </li>
              <li className="step">
                <span className="step__n" aria-hidden="true">2</span>
                <h3>Te suscribes a las que quieras</h3>
                <p>A una, a varias o a las tres. Cada suscripción es independiente y se cancela por separado.</p>
              </li>
              <li className="step">
                <span className="step__n" aria-hidden="true">3</span>
                <h3>Ves la composición completa</h3>
                <p>Instrumentos, ISIN y peso de cada uno, y el histórico de todos los cambios.</p>
              </li>
              <li className="step">
                <span className="step__n" aria-hidden="true">4</span>
                <h3>Recibes un aviso cuando cambia</h3>
                <p>Por web, WhatsApp, Telegram o correo electrónico. Qué hacer con esa información lo decides tú.</p>
              </li>
            </ol>

            <div className="split">
              <div className="split__copy">
                <h3 className="split__title">Qué incluye cada aviso de cambio</h3>
                <p>Cada aviso describe el cambio en la cartera modelo de forma objetiva, sin decirte qué hacer.</p>
                <ul className="ticks">
                  <li><Icon name="i-check" />Quién elabora la cartera modelo</li>
                  <li><Icon name="i-check" />Fecha y hora del cambio</li>
                  <li><Icon name="i-check" />Qué incorpora, reduce o elimina la cartera modelo</li>
                  <li><Icon name="i-check" />Por qué, según su metodología</li>
                  <li><Icon name="i-check" />Posibles conflictos de interés</li>
                  <li><Icon name="i-check" />Recordatorio de riesgos y de que el contenido es genérico</li>
                </ul>
              </div>
              <figure className="split__media" aria-label="Ejemplo de aviso de cambio">
                <div className="phone">
                  <div className="phone__bar"><Icon name="logo-m" />FixMyFreedom</div>
                  <div className="phone__msg">
                    <p className="phone__label">Cartera Moderada · 1 oct. 2026, 09:00</p>
                    <p className="phone__action"><span className="tag tag--alta">Cambio en la cartera modelo</span></p>
                    <p className="phone__asset">Incorpora un ETF de materias primas diversificado</p>
                    <dl className="phone__data">
                      <div><dt>Peso nuevo</dt><dd>5 %</dd></div>
                      <div><dt>ETC de oro físico</dt><dd>del 10 % al 5 %</dd></div>
                    </dl>
                    <p className="phone__why">Motivo: la metodología prevé diversificar el bloque de materias primas.</p>
                    <p className="phone__label" style={{ marginTop: "0.75rem" }}>Elaborada por {AUTOR.nombre}</p>
                  </div>
                </div>
                <figcaption>Ejemplo ficticio de aviso de cambio.</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="pricing" id="precios" aria-labelledby="pricing-title">
          <div className="wrap">
            <div className="section-head section-head--center">
              <h2 id="pricing-title" className="section-title">Las tres carteras modelo</h2>
              <p className="section-lead">
                Ordenadas de menor a mayor riesgo. Puedes suscribirte a una, a varias o a las tres; cada una se paga y se
                cancela por separado. Todas incluyen avisos por web, WhatsApp, Telegram y correo electrónico.
              </p>
            </div>
            <ComparadorCarteras carteras={carteras} />
            <p className="pricing__note">{AVISOS.rentabilidadPasada}</p>
          </div>
        </section>

        <section className="contact" id="contacto" aria-labelledby="contact-title">
          <div className="wrap contact__grid">
            <div className="contact__info">
              <h2 id="contact-title" className="section-title">Escríbenos</h2>
              <p className="section-lead">
                ¿Dudas sobre cómo funcionan las carteras modelo, los avisos o la suscripción? Te respondemos en un día
                laborable. No podemos decirte qué cartera elegir: no prestamos asesoramiento.
              </p>
              <dl className="contact__list">
                <div><dt>Correo electrónico</dt><dd>contacto@ejemplo.com</dd></div>
                <div><dt>Teléfono</dt><dd>+34 600 000 000</dd></div>
                <div><dt>Horario</dt><dd>De lunes a viernes, de 9:00 a 18:00</dd></div>
              </dl>
            </div>
            <DemoForm className="form" boton="Enviar mensaje" mensaje="Este formulario es de ejemplo: el mensaje no se ha enviado.">
              <Campo id="c-name" name="nombre" label="Nombre" autoComplete="name" />
              <Campo id="c-email" name="correo" label="Correo electrónico" type="email" autoComplete="email" />
              <Campo id="c-tema" name="tema" label="Tema" required={false}>
                <option>Funcionamiento del servicio</option>
                <option>Suscripción y pagos</option>
                <option>Avisos y canales</option>
                <option>Otro</option>
              </Campo>
              <Campo id="c-msg" name="mensaje" label="Mensaje" multiline />
            </DemoForm>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
