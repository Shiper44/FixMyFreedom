import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IconSprite } from "@/components/Icons";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "FixMyFreedom: tres carteras modelo de inversión", template: "%s · FixMyFreedom" },
  description:
    "Tres carteras modelo genéricas con distinto nivel de riesgo. Si te suscribes, recibes un aviso cada vez que la cartera modelo cambia.",
  icons: { icon: "/assets/favicon.svg" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <IconSprite />
        <a className="skip" href="#contenido">Saltar al contenido</a>
        {children}
      </body>
    </html>
  );
}
