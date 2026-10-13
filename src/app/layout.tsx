import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const jakarta = localFont({
  src: "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
  variable: "--font-jakarta",
  display: "swap",
  weight: "200 800",
});

const symbols = localFont({
  src: "../assets/fonts/material-symbols-rounded.woff2",
  variable: "--font-rounded-icons",
  display: "block",
  preload: true,
  weight: "500",
});

export const metadata: Metadata = {
  title: "DIRCOM · Nuestro equipo",
  description:
    "El espacio de encuentro de DIRCOM: cumpleaños, reconocimiento y actividades de oficina. Primera etapa con datos de ejemplo.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${jakarta.variable} ${symbols.variable}`}>
      <body className="antialiased">
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
