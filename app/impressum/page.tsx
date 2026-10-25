import { Subpage } from "@/components/subpage";
import { business } from "@/lib/content";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata({
  title: "Impressum",
  description:
    "Impressum und Kontaktdaten von L&S Entrümpelung & Demontagearbeiten.",
  path: "/impressum/",
});
export default function Impressum() {
  return (
    <Subpage lang="de">
      <h1>Impressum</h1>
      <h2>Angaben zum Unternehmen</h2>
      <p>{business.name}</p>
      <p>Inhaber: {business.owner}</p>
      <address>
        {business.address.street}
        <br />
        {business.address.postalCode} {business.address.city}
        <br />
        {business.address.country}
      </address>
      <p>Steuerliche Kennnummer: {business.taxReference}</p>
      <h2>Kontakt</h2>
      <p>
        {business.phone && (
          <>
            Telefon:{" "}
            <a href={`tel:${business.phone.replace(/[^+\d]/g, "")}`}>
              {business.phone}
            </a>
            <br />
          </>
        )}
        E-Mail: <a href={`mailto:${business.email}`}>{business.email}</a>
      </p>
    </Subpage>
  );
}
