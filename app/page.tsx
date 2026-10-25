import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { ServicesOverview } from "@/components/services-overview";
import { Inquiry } from "@/components/inquiry";
import { Footer } from "@/components/footer";
import { ContactActions } from "@/components/contact-actions";
import { TrustBand } from "@/components/trust-band";
import { Gallery } from "@/components/gallery";
import { Reviews } from "@/components/reviews";
import { BeforeAfter } from "@/components/before-after";
import { business } from "@/lib/content";
import { homeDescription, pageMetadata } from "@/lib/site";
export const metadata = pageMetadata({
  description: homeDescription,
  path: "/",
});
const faqs = [
  [
    "Was kostet mein Auftrag?",
    "Der Preis hängt vom Umfang und vom Aufwand ab. Beschreiben Sie Ihren Auftrag kurz, und Sie erhalten ein individuelles Angebot.",
  ],
  [
    "In welchen Regionen ist L&S tätig?",
    "Deutschlandweit nach Absprache. Nennen Sie uns einfach Postleitzahl und Ort.",
  ],
  [
    "Kann ich mehrere Leistungen kombinieren?",
    "Ja – zum Beispiel Entrümpelung, Entsorgung und Reinigung in einem Auftrag.",
  ],
  [
    "Welche Angaben helfen bei meiner Anfrage?",
    "Leistung, Ort, ungefähre Menge, Stockwerk und Wunschtermin. Fotos helfen besonders.",
  ],
  [
    "Wann sind Sie erreichbar?",
    "Rund um die Uhr. Den Termin für den Auftrag stimmen wir persönlich mit Ihnen ab.",
  ],
];
export default function Home() {
  return (
    <>
      <a href="#inhalt" className="skip-link">
        Zum Inhalt springen
      </a>
      <Header />
      <main id="inhalt" tabIndex={-1}>
        <Hero />
        <TrustBand />
        <ServicesOverview />
        <section className="process section" id="ablauf">
          <div className="process-intro">
            <span className="eyebrow">01 / KLARER ABLAUF</span>
            <h2>
              Ein guter Start:
              <br />
              <span>ein klares Gespräch.</span>
            </h2>
            <p>Drei Schritte – keine Überraschungen.</p>
            <a href="#anfrage" className="text-link">
              Jetzt starten <ArrowUpRight size={18} />
            </a>
            <div className="process-wordmark" aria-hidden="true">
              L<span>&</span>S<span className="wordmark-dot">.</span>
            </div>
          </div>
          <ol className="process-steps">
            <li>
              <span>01</span>
              <div>
                <h3>Sie erzählen. Wir hören zu.</h3>
                <p>
                  Beschreiben Sie kurz, was zu tun ist – Fotos sind willkommen.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Wir klären die Details.</h3>
                <p>Umfang, Termin und Preis – fest vereinbart.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Wir packen an.</h3>
                <p>Pünktlich zum Termin. Besenrein übergeben.</p>
              </div>
            </li>
          </ol>
        </section>
        <BeforeAfter />
        <Gallery />
        <Reviews />
        <section className="questions section" id="fragen">
          <div>
            <span className="eyebrow">02 / GUT ZU WISSEN</span>
            <h2>
              Noch eine
              <br />
              Frage?
            </h2>
            <p>Alles Weitere klären wir gern persönlich mit Ihnen.</p>
            <a className="text-link" href={`mailto:${business.email}`}>
              Schreiben Sie uns <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="faq-list">
            {faqs.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span className="faq-plus" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="contact section" id="anfrage">
          <div className="contact-intro">
            <span className="eyebrow">03 / IHR NÄCHSTER SCHRITT</span>
            <h2>
              Was dürfen wir
              <br />
              für Sie übernehmen?
            </h2>
            <p>Beschreiben Sie es kurz – wir melden uns bei Ihnen.</p>
            <a className="contact-email" href={`mailto:${business.email}`}>
              {business.email} <ArrowUpRight size={18} />
            </a>
            <ContactActions compact />
            <div className="contact-note">
              <span className="status-dot" />
              <span>
                Rund um die Uhr erreichbar
                <br />
                <small>Deutschland – Einsatzgebiet nach Absprache</small>
              </span>
            </div>
          </div>
          <Inquiry />
        </section>
      </main>
      <Footer />
    </>
  );
}
