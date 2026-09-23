import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Datenschutzhinweise | L&S",
  robots: { index: false, follow: false },
};
export default function Privacy() {
  return (
    <main id="inhalt" className="legal">
      <Link href="/">← Zur Startseite</Link>
      <h1>Datenschutzhinweise</h1>
      <div className="legal-note">
        Vorläufige Hinweise für die lokale Website. Vor einer Veröffentlichung
        sind die Angaben zum Verantwortlichen und zum tatsächlichen Hosting zu
        vervollständigen und die Datenschutzerklärung zu prüfen.
      </div>
      <h2>Kontakt</h2>
      <p>
        L&S Entrümpelung & Demontagearbeiten
        <br />
        <a href="mailto:Info@entruempelung-demontage.de">
          Info@entruempelung-demontage.de
        </a>
      </p>
      <h2>Anfrage per E-Mail</h2>
      <p>
        Das Anfrageformular bereitet ausschließlich einen E-Mail-Text in Ihrem
        Browser vor. Es sendet keine Formulardaten an einen Server und speichert
        diese nicht dauerhaft. Erst wenn Sie den Entwurf in Ihrem
        E-Mail-Programm selbst versenden, werden Ihre Angaben über Ihren
        E-Mail-Anbieter übermittelt. Die Kopierfunktion schreibt den Anfragetext
        auf Ihren Wunsch in die Zwischenablage.
      </p>
      <h2>Technische Einbindung</h2>
      <p>
        Die Website verwendet keine Analysewerkzeuge, Werbetracker oder
        eingebetteten Karten. Bilder und Schriftarten werden lokal mit der
        Website ausgeliefert. Es werden durch die Website keine Cookies gesetzt.
      </p>
      <h2>Vor der Veröffentlichung</h2>
      <p>
        Die endgültigen Hinweise müssen insbesondere den vollständigen
        Verantwortlichen, Hosting und Protokolldaten, die Bearbeitung
        eingehender E-Mails sowie die dazugehörigen Rechtsgrundlagen,
        Speicherdauer und Betroffenenrechte abdecken. Die hierfür erforderlichen
        Unternehmens- und Hostingangaben liegen noch nicht vor.
      </p>
    </main>
  );
}
