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
      <h2>Anfragen über WhatsApp</h2>
      <p>
        Das Anfrageformular öffnet WhatsApp mit Ihrer ausgewählten Leistung,
        Ihrem Namen, dem Einsatzort und Ihrer Nachricht. Diese Angaben werden
        beim Öffnen an WhatsApp übergeben. Sie senden die vorbereitete Nachricht
        anschließend selbst in WhatsApp ab. Die Website speichert Ihre
        Formulareingaben nicht dauerhaft.
      </p>
      <h2>Anruf und WhatsApp</h2>
      <p>
        Die Anruf-Links öffnen die Telefon-App Ihres Geräts. Der Link „Per
        WhatsApp schreiben“ öffnet WhatsApp (wa.me) mit einer vorbereiteten
        Nachricht; dort gelten die Datenschutzbestimmungen von WhatsApp.
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
