import Link from "next/link";
import type { Metadata } from "next";
import { Subpage } from "@/components/subpage";
// Next.js marks the 404 page noindex on its own.
export const metadata: Metadata = { title: "Seite nicht gefunden" };
export default function NotFound() {
  return (
    <Subpage>
      <span className="eyebrow">L&S / SEITE NICHT GEFUNDEN</span>
      <h1>Hier ist viel Platz.</h1>
      <p>
        Die gesuchte Seite gibt es nicht. Auf unserer Startseite finden Sie alle
        Leistungen und Kontaktmöglichkeiten.
      </p>
      <Link className="button button-dark" href="/">
        Zur Startseite ↗
      </Link>
    </Subpage>
  );
}
