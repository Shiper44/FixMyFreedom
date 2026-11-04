"use client";
import { createContext, useContext, useState, type FormEvent, type ReactNode } from "react";

// Formulario de demostración: valida los campos en el navegador pero no envía nada.
const Errores = createContext<Record<string, string>>({});

export function DemoForm({ className, mensaje, boton, children }: {
  className?: string;
  mensaje: string;
  boton: string;
  children: ReactNode;
}) {
  const [estado, setEstado] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nuevos: Record<string, string> = {};
    let primero: HTMLInputElement | null = null;
    for (const el of Array.from(e.currentTarget.elements)) {
      const f = el as HTMLInputElement;
      if (!f.name || !f.willValidate || f.checkValidity()) continue;
      nuevos[f.name] = f.validity.valueMissing
        ? "Rellena este campo."
        : "Escribe un correo electrónico válido, por ejemplo nombre@dominio.com.";
      primero ??= f;
    }
    setErrores(nuevos);
    if (primero) {
      setEstado("");
      primero.focus();
      return;
    }
    setEstado(mensaje);
  }

  return (
    <Errores.Provider value={errores}>
      <form className={className} noValidate onSubmit={onSubmit}>
        {children}
        <button className="btn btn--grape" type="submit">{boton}</button>
        <p className="form__status" role="status">{estado}</p>
      </form>
    </Errores.Provider>
  );
}

export function Campo({ id, name, label, type = "text", autoComplete, required = true, multiline = false, children }: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  multiline?: boolean;
  children?: ReactNode; // opciones de un <select>
}) {
  const error = useContext(Errores)[name];
  const comunes = {
    id,
    name,
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
    onInput: undefined,
  };
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children ? (
        <select {...comunes}>{children}</select>
      ) : multiline ? (
        <textarea {...comunes} rows={5} />
      ) : (
        <input {...comunes} type={type} autoComplete={autoComplete} />
      )}
      {error && <p className="field__error" id={`${id}-error`}>{error}</p>}
    </div>
  );
}
