import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Impressum | L&S",
  robots: { index: false, follow: false },
};
export default function Impressum() {
  return (
    <main id="inhalt" className="legal">
      <Link href="/">← Zur Startseite</Link>
      <h1>Impressum</h1>
      <div className="legal-note">
        Diese Website befindet sich im Aufbau. Die Anbieterangaben sind noch
        unvollständig und müssen vor der Veröffentlichung ergänzt werden.
      </div>
      <h2>L&S Entrümpelung & Demontagearbeiten</h2>
      <p>
        E-Mail:{" "}
        <a href="mailto:Info@entruempelung-demontage.de">
          Info@entruempelung-demontage.de
        </a>
      </p>
      <h2>Noch zu ergänzende Angaben</h2>
      <p>
        Vollständiger Name des Inhabers bzw. die Firma, eine ladungsfähige
        Anschrift, gegebenenfalls Vertretungsberechtigte, Registerangaben und
        die Umsatzsteuer-Identifikationsnummer.
      </p>
      <h2>Bildnachweise</h2>
      <p>
        Vorher-Nachher-Regler auf der Startseite: Beispielbilder, keine Projekte
        von L&S; die Nachher-Ansichten wurden bearbeitet. Schlafzimmerfoto:
        Roger Mommaerts / Flickr (CC).
      </p>
    </main>
  );
}
