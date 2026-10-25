import { Subpage } from "@/components/subpage";
import { business } from "@/lib/content";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata({
  title: "Datenschutz",
  description:
    "Datenschutzhinweise von L&S Entrümpelung & Demontagearbeiten: Anfrageformular, Kontakt per Telefon, WhatsApp und E-Mail.",
  path: "/datenschutz/",
});
export default function Datenschutz() {
  return (
    <Subpage>
      <h1>Datenschutz&shy;hinweise</h1>
      <div className="legal-note">
        Vorläufiger Hinweis. Vor dem Livegang müssen die Angaben zum
        Verantwortlichen und zum endgültigen Hosting ergänzt und die
        Datenschutzerklärung rechtlich geprüft werden.
      </div>
      <h2>Kontakt</h2>
      <p>
        L&S Entrümpelung & Demontagearbeiten
        <br />
        <a href={`mailto:${business.email}`}>{business.email}</a>
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
      <h2>Anruf und WhatsApp</h2>
      <p>
        Die Anruf-Links öffnen die Telefon-App Ihres Geräts. Der Link „Per
        WhatsApp schreiben“ öffnet WhatsApp (wa.me) mit einer vorbereiteten
        Nachricht; dort gelten die Datenschutzbestimmungen von WhatsApp. Die
        Website selbst überträgt dabei keine Daten.
      </p>
      <h2>Technische Umsetzung</h2>
      <p>
        Die Website verwendet keine Analysewerkzeuge, keine Werbetracker und
        keine eingebetteten Karten. Bilder und Schriften werden lokal mit der
        Website ausgeliefert. Die Website setzt keine Cookies. Die derzeitige
        Vorschau wird über GitHub Pages (GitHub, Inc.) bereitgestellt; beim
        Aufruf verarbeitet der Hoster technisch notwendige Verbindungsdaten wie
        Ihre IP-Adresse.
      </p>
      <h2>Vor der Veröffentlichung</h2>
      <p>
        Der endgültige Hinweis muss insbesondere den vollständigen
        Verantwortlichen, Hosting und Logdaten, den Umgang mit eingehenden
        E-Mails sowie die jeweiligen Rechtsgrundlagen, Speicherfristen und
        Betroffenenrechte abdecken. Die dafür nötigen Firmen- und Hostingangaben
        liegen noch nicht vor.
      </p>
    </Subpage>
  );
}
