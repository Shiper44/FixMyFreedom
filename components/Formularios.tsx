"use client";
// Formularios conectados a acciones de servidor.
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  accionConfirmarAcceso,
  accionPortal,
  accionSolicitarAcceso,
  accionSuscribirse,
  type EstadoFormulario,
} from "@/app/acciones";

function Enviar({ texto, enviando, clase = "btn btn--grape" }: { texto: string; enviando: string; clase?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={clase} type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? enviando : texto}
    </button>
  );
}

function Estado({ estado }: { estado: EstadoFormulario }) {
  return (
    <>
      {estado.error && <p className="form__error" role="alert">{estado.error}</p>}
      <p className="form__status" role="status">{estado.mensaje ?? ""}</p>
    </>
  );
}

export function FormularioAcceso({ volver }: { volver?: string }) {
  const [estado, accion] = useActionState(accionSolicitarAcceso, {});
  return (
    <form className="auth__form" action={accion}>
      <div className="field">
        <label htmlFor="l-email">Correo electrónico</label>
        <input id="l-email" name="correo" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="l-nombre">Nombre <span className="field__hint">(solo si es tu primera vez)</span></label>
        <input id="l-nombre" name="nombre" type="text" autoComplete="given-name" />
      </div>
      {volver && <input type="hidden" name="volver" value={volver} />}
      <Enviar texto="Enviarme el enlace" enviando="Enviando…" />
      <Estado estado={estado} />
      {estado.enlaceDesarrollo && (
        <p className="nota">
          Modo desarrollo (sin proveedor de correo): <a href={estado.enlaceDesarrollo}>abrir el enlace de acceso</a>
        </p>
      )}
    </form>
  );
}

export function FormularioConfirmarAcceso({ token, volver }: { token: string; volver?: string }) {
  const [estado, accion] = useActionState(accionConfirmarAcceso, {});
  return (
    <form className="auth__form" action={accion}>
      <input type="hidden" name="token" value={token} />
      {volver && <input type="hidden" name="volver" value={volver} />}
      <Enviar texto="Entrar en FixMyFreedom" enviando="Entrando…" />
      <Estado estado={estado} />
    </form>
  );
}

export function FormularioSuscripcion({ slug, textoAceptacion, versionTexto }: {
  slug: string;
  textoAceptacion: string;
  versionTexto: string;
}) {
  const [estado, accion] = useActionState(accionSuscribirse, {});
  return (
    <form className="suscribir" action={accion}>
      <input type="hidden" name="cartera" value={slug} />
      <input type="hidden" name="version_texto" value={versionTexto} />
      <label className="acepto">
        <input type="checkbox" name="acepta" value="si" required />
        <span>{textoAceptacion}</span>
      </label>
      <Enviar texto="Ir al pago" enviando="Preparando el pago…" clase="btn btn--amber" />
      <Estado estado={estado} />
    </form>
  );
}

export function BotonPortal({ texto, suscripcionId, clase = "btn btn--outline-dark" }: {
  texto: string;
  suscripcionId?: string;
  clase?: string;
}) {
  const [estado, accion] = useActionState(accionPortal, {});
  return (
    <form action={accion} className="form-inline">
      {suscripcionId && <input type="hidden" name="suscripcion" value={suscripcionId} />}
      <Enviar texto={texto} enviando="Abriendo…" clase={clase} />
      {estado.error && <p className="form__error" role="alert">{estado.error}</p>}
    </form>
  );
}
