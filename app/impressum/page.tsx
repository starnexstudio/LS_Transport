import { Subpage } from "@/components/subpage";
import { business } from "@/lib/content";
import { pageMetadata } from "@/lib/site";
export const metadata = pageMetadata({
  title: "Legal Notice",
  description:
    "Legal notice and contact details for L&S Entrümpelung & Demontagearbeiten.",
  path: "/impressum/",
});
export default function Impressum() {
  return (
    <Subpage lang="en">
      <h1>Legal Notice</h1>
      <h2>Business details</h2>
      <p lang="de">{business.name}</p>
      <p>Owner: {business.owner}</p>
      <address>
        {business.address.street}
        <br />
        {business.address.postalCode} {business.address.city}
        <br />
        {business.address.country}
      </address>
      <p>Tax reference: {business.taxReference}</p>
      <h2>Contact</h2>
      <p>
        {business.phone && (
          <>
            Phone:{" "}
            <a href={`tel:${business.phone.replace(/[^+\d]/g, "")}`}>
              {business.phone}
            </a>
            <br />
          </>
        )}
        Email: <a href={`mailto:${business.email}`}>{business.email}</a>
      </p>
    </Subpage>
  );
}
