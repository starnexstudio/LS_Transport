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
      <h2>Kontakt</h2>
      <p>
        {business.name}
        <br />
        {business.owner}
        <br />
        {business.address.street}
        <br />
        {business.address.postalCode} {business.address.city}
        <br />
        Deutschland
        <br />
        {business.phone && (
          <>
            Telefon:{" "}
            <a href={`tel:${business.phone.replace(/[^+\d]/g, "")}`}>
              {business.phone}
            </a>
            <br />
          </>
        )}
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
        Website ausgeliefert. Die Website setzt keine Cookies. Die Website wird
        über GitHub Pages (GitHub, Inc.) bereitgestellt; beim Aufruf verarbeitet
        der Hoster technisch notwendige Verbindungsdaten wie Ihre IP-Adresse.
      </p>
    </Subpage>
  );
}
