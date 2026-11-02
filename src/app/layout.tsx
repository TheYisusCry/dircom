import { LiveProvider } from "@/components/live/live-provider";
import { Analytics } from "@vercel/analytics/next";
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
    "El espacio de encuentro de DIRCOM: cumpleaños, reconocimiento y actividades de oficina.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
  },
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
        <LiveProvider>{children}</LiveProvider>
        <Analytics />
      </body>
    </html>
  );
}
