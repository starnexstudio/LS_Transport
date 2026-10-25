import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// Frame for the inner pages (Impressum, Datenschutz, 404): the site header on a
// teal band, the page content and the footer, as on the home page.
export function Subpage({
  children,
  lang,
}: {
  children: React.ReactNode;
  lang?: "de" | "en";
}) {
  return (
    <>
      <a href="#inhalt" className="skip-link">
        Zum Inhalt springen
      </a>
      <div className="subpage-band">
        <Header />
      </div>
      <main id="inhalt" tabIndex={-1} className="legal" lang={lang}>
        {children}
      </main>
      <Footer />
    </>
  );
}
