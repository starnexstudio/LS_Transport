import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import "./motion.css";
import { MotionEffects } from "@/components/motion-effects";
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});
export const metadata: Metadata = {
  title: "L&S | Entrümpelung & Demontagearbeiten",
  description:
    "Platz für Neues. Entrümpelung, fachgerechte Entsorgung, Demontage und Möbelservice. Deutschlandweit nach Absprache. Jetzt Ihr Vorhaben anfragen.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className={manrope.variable}>
        {children}
        <MotionEffects />
      </body>
    </html>
  );
}
