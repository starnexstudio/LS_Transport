import type { Metadata } from "next";
import { Archivo, Manrope } from "next/font/google";
import "./globals.css";
import "./motion.css";
import "./hero.css";
import "./before-after.css";
import { FloatingContact } from "@/components/floating-contact";
import { MotionEffects } from "@/components/motion-effects";
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});
// Sturdy display face for headings; the width axis echoes the wide logo lettering.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["wdth"],
  display: "swap",
});
export const metadata: Metadata = {
  title: "L&S | Entrümpelung & Demontagearbeiten",
  description:
    "Platz für Neues. Entrümpelung, fachgerechte Entsorgung, Demontage, Möbeltransport und Reinigung. Deutschlandweit nach Absprache. Jetzt Ihr Vorhaben anfragen.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className={`${manrope.variable} ${archivo.variable}`}>
        {children}
        <FloatingContact />
        <MotionEffects />
      </body>
    </html>
  );
}
