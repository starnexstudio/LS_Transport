import { Subpage } from "@/components/subpage";
import { business } from "@/lib/content";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata({
  title: "Impressum",
  description:
    "Anbieterkennzeichnung von L&S Entrümpelung & Demontagearbeiten: Kontakt und Bildnachweise.",
  path: "/impressum/",
});
export default function Impressum() {
  return (
    <Subpage>
      <h1>Impressum</h1>
      <div className="legal-note">
        Diese Website befindet sich im Aufbau. Die Anbieterangaben sind noch
        unvollständig und müssen vor der Veröffentlichung ergänzt werden.
      </div>
      <h2>L&S Entrümpelung & Demontagearbeiten</h2>
      <p>
        E-Mail: <a href={`mailto:${business.email}`}>{business.email}</a>
        {business.phone && (
          <>
            <br />
            Telefon:{" "}
            <a href={`tel:${business.phone.replace(/[^+\d]/g, "")}`}>
              {business.phone}
            </a>
          </>
        )}
      </p>
      <h2>Noch zu ergänzende Angaben</h2>
      <p>
        Vollständiger Name des Inhabers bzw. die Firma, eine ladungsfähige
        Anschrift, gegebenenfalls Vertretungsberechtigte, Registerangaben und
        die Umsatzsteuer-Identifikationsnummer.
      </p>
      <h2>Bildnachweise</h2>
      <p>
        Vorher-Nachher-Vergleiche auf der Startseite: vom Betreiber
        bereitgestellte Fotos.
      </p>
      <p>
        „Im Einsatz“: Symbolbilder, keine Aufnahmen von L&S-Mitarbeitenden oder
        -Aufträgen. Sechs Bilder wurden mit KI erzeugt; „Möbel geschützt“: MART
        PRODUCTION / Pexels, „Sorgfältig verpackt“: Ketut Subiyanto / Pexels.
      </p>
      <p>
        Die 3D-Szene oben auf der Startseite ist eine Illustration. Möbel,
        Oberflächen und Beleuchtung stammen von Poly Haven (CC0).
      </p>
    </Subpage>
  );
}
