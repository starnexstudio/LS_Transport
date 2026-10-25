import type { Metadata, Viewport } from "next";
import { Archivo, Manrope } from "next/font/google";
import "./globals.css";
import "./motion.css";
import "./hero.css";
import "./before-after.css";
import "./showcase.css";
import { FloatingContact } from "@/components/floating-contact";
import { MotionEffects } from "@/components/motion-effects";
import { homeDescription, indexable, siteUrl, titles } from "@/lib/site";
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});
// Sturdy display face for headings. Only the weight axis: the headings use the
// normal width, and the width axis would add about 50 KB to a preloaded font.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
export const metadata: Metadata = {
  title: titles,
  description: homeDescription,
  ...(siteUrl && { metadataBase: new URL(`${siteUrl}/`) }),
  // A preview stays out of search results until SITE_URL and ALLOW_INDEXING are set.
  robots: indexable ? undefined : { index: false, follow: false },
};
// Browser chrome on phones in the hero's teal.
export const viewport: Viewport = { themeColor: "#00757f" };
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
