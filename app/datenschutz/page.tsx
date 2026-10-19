import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Datenschutzhinweise | L&S",
  robots: { index: false, follow: false },
};
export default function Datenschutz() {
  return (
    <main id="inhalt" className="legal">
      <Link href="/">← Zur Startseite</Link>
      <h1>Datenschutzhinweise</h1>
      <div className="legal-note">
        Vorläufiger Hinweis für die lokale Website. Vor der Veröffentlichung
        müssen die Angaben zum Verantwortlichen und zum tatsächlichen Hosting
        ergänzt und die Datenschutzerklärung geprüft werden.
      </div>
      <h2>Kontakt</h2>
      <p>
        L&S Entrümpelung & Demontagearbeiten
        <br />
        <a href="mailto:Info@entruempelung-demontage.de">
          Info@entruempelung-demontage.de
        </a>
      </p>
      <h2>Anfragen per E-Mail</h2>
      <p>
        Das Anfrageformular bereitet nur einen E-Mail-Text in Ihrem Browser vor.
        Es sendet keine Formulardaten an einen Server und speichert sie nicht
        dauerhaft. Ihre Angaben werden erst über Ihren E-Mail-Anbieter
        übermittelt, wenn Sie den Entwurf selbst aus Ihrem E-Mail-Programm
        senden. Auf Ihren Wunsch legt die Kopierfunktion den Anfragetext in
        Ihrer Zwischenablage ab.
      </p>
      <h2>Technische Umsetzung</h2>
      <p>
        Die Website verwendet keine Analysewerkzeuge, keine Werbetracker und
        keine eingebetteten Karten. Bilder und Schriften werden lokal mit der
        Website ausgeliefert. Die Website setzt keine Cookies.
      </p>
      <h2>Vor der Veröffentlichung</h2>
      <p>
        Der endgültige Hinweis muss insbesondere den vollständigen
        Verantwortlichen, Hosting und Logdaten, den Umgang mit eingehenden
        E-Mails sowie die jeweiligen Rechtsgrundlagen, Speicherfristen und
        Betroffenenrechte abdecken. Die dafür nötigen Firmen- und Hostingangaben
        liegen noch nicht vor.
      </p>
    </main>
  );
}
