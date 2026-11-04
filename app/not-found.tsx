import Link from "next/link";
import { Header } from "@/components/Header";

export default function NoEncontrado() {
  return (
    <>
      <Header solid />
      <main id="contenido" className="page">
        <div className="wrap page__head">
          <h1>Esta página no existe</h1>
          <p>Puede que el enlace esté mal escrito o que la página se haya movido.</p>
          <p><Link className="crumb" href="/">Ir a la página principal</Link></p>
        </div>
      </main>
    </>
  );
}
