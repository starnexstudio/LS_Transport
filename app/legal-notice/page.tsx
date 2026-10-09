import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Legal notice | L&S",
  robots: { index: false, follow: false },
};
export default function LegalNotice() {
  return (
    <main id="inhalt" className="legal">
      <Link href="/">← Back to home</Link>
      <h1>Legal notice</h1>
      <div className="legal-note">
        This website is in preparation. The provider details are not yet
        complete and must be added before publication.
      </div>
      <h2>L&S Entrümpelung & Demontagearbeiten</h2>
      <p>
        Email:{" "}
        <a href="mailto:Info@entruempelung-demontage.de">
          Info@entruempelung-demontage.de
        </a>
      </p>
      <h2>Details still to be added</h2>
      <p>
        Full name of the owner or the legal company name, a postal address for
        service, authorised representatives where applicable, register details
        and the VAT identification number.
      </p>
      <h2>Image credits</h2>
      <p>
        Drag-to-compare sliders on the home page: illustrative images, not L&S
        projects; the after views have been edited. Bedroom photo: Roger
        Mommaerts / Flickr (CC).
      </p>
    </main>
  );
}
