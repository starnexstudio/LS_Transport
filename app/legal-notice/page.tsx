import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Impressum | L&S",
  robots: { index: false, follow: false },
};
export default function LegalNotice() {
  return (
    <main id="inhalt" className="legal">
      <Link href="/">← Zur Startseite</Link>
      <h1>Impressum</h1>
      <div className="legal-note">
        Diese Website befindet sich in Vorbereitung. Die Anbieterangaben sind
        noch nicht vollständig und müssen vor einer Veröffentlichung ergänzt
        werden.
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
        Vollständiger Name des Inhabers oder rechtlicher Unternehmensname,
        ladungsfähige Anschrift und gegebenenfalls Vertretungsberechtigte,
        Registerangaben und Umsatzsteuer-Identifikationsnummer.
      </p>
    </main>
  );
}
