import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Services } from "@/components/services";
import { Inquiry } from "@/components/inquiry";
import { Footer } from "@/components/footer";
import { ContactActions } from "@/components/contact-actions";
import { PhotoExample } from "@/components/photo-example";
const faqs = [
  [
    "Was kostet mein Auftrag?",
    "Der Preis richtet sich nach Umfang und Aufwand. Beschreiben Sie kurz Ihr Vorhaben – Sie erhalten ein individuelles Angebot.",
  ],
  [
    "In welchen Regionen ist L&S im Einsatz?",
    "Deutschlandweit nach Absprache. Nennen Sie uns einfach Postleitzahl und Ort.",
  ],
  [
    "Kann ich mehrere Leistungen kombinieren?",
    "Ja – zum Beispiel Entrümpelung, Entsorgung und Reinigung in einem Auftrag.",
  ],
  [
    "Welche Angaben helfen bei meiner Anfrage?",
    "Leistung, Ort, ungefähre Menge, Etage und Wunschtermin. Fotos helfen besonders.",
  ],
  [
    "Wann kann ich Sie erreichen?",
    "Rund um die Uhr. Den Termin für den Einsatz vereinbaren wir persönlich mit Ihnen.",
  ],
];
export default function Home() {
  return (
    <>
      <a href="#inhalt" className="skip-link">
        Zum Inhalt springen
      </a>
      <Header />
      <main id="inhalt">
        <Hero />
        <section className="section services" id="leistungen">
          <div className="section-top">
            <div>
              <span className="eyebrow">01 / UNSERE LEISTUNGEN</span>
              <h2>
                Was ansteht.
                <br />
                Was wir übernehmen.
              </h2>
            </div>
            <p>Einzeln oder kombiniert – passend zu Ihrem Vorhaben.</p>
          </div>
          <Services />
        </section>
        <section className="process section" id="ablauf">
          <div className="process-intro">
            <span className="eyebrow">02 / KLARER ABLAUF</span>
            <h2>
              Ein guter Anfang:
              <br />
              <span>ein klares Gespräch.</span>
            </h2>
            <p>Drei Schritte – ohne Überraschungen.</p>
            <a href="#anfrage" className="text-link">
              Lassen Sie uns anfangen <ArrowUpRight size={18} />
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
                <p>Kurz beschreiben, was ansteht – gern mit Fotos.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Wir klären die Details.</h3>
                <p>Umfang, Termin und Preis – verbindlich abgestimmt.</p>
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
        <PhotoExample />
        <section className="questions section" id="fragen">
          <div>
            <span className="eyebrow">03 / GUT ZU WISSEN</span>
            <h2>
              Noch eine
              <br />
              Frage offen?
            </h2>
            <p>Alles Weitere klären wir persönlich.</p>
            <a
              className="text-link"
              href="mailto:Info@entruempelung-demontage.de"
            >
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
            <span className="eyebrow">04 / IHR NÄCHSTER SCHRITT</span>
            <h2>
              Was dürfen wir
              <br />
              für Sie anpacken?
            </h2>
            <p>Kurz beschreiben – wir melden uns.</p>
            <a
              className="contact-email"
              href="mailto:Info@entruempelung-demontage.de"
            >
              Info@entruempelung-demontage.de <ArrowUpRight size={18} />
            </a>
            <ContactActions compact />
            <div className="contact-note">
              <span className="status-dot" />
              <span>
                24 Stunden erreichbar
                <br />
                <small>Deutschland – Einsatzbereich nach Absprache</small>
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
