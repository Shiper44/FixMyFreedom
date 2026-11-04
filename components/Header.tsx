"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";

export function Header({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen((o) => {
          if (o) toggle.current?.focus();
          return false;
        });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const cls = ["site-header", solid ? "site-header--solid" : "", scrolled ? "is-scrolled" : ""].filter(Boolean).join(" ");

  return (
    <header className={cls}>
      <Link className="brand" href="/" aria-label="FixMyFreedom, inicio">
        <Icon name="logo-m" className="brand__mark" />
        <span className="brand__name">FixMyFreedom</span>
      </Link>
      <button
        ref={toggle}
        className="nav-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="nav-toggle__bars" aria-hidden="true" />
        <span className="visually-hidden">{open ? "Cerrar menú" : "Abrir menú"}</span>
      </button>
      <nav className={`nav${open ? " is-open" : ""}`} id="menu" aria-label="Principal" onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) setOpen(false);
      }}>
        <ul className="nav__list">
          <li><Link href="/#sobre-nosotros">Sobre nosotros</Link></li>
          <li><Link href="/#precios">Precios</Link></li>
          <li><Link href="/#contacto">Contacto</Link></li>
        </ul>
        <Link className="btn btn--amber nav__login" href="/login">Iniciar sesión</Link>
      </nav>
    </header>
  );
}
