import Image from "next/image";
import { asset } from "@/lib/base-path";
import { ArrowUpRight, ArrowDown, MapPin, Clock3 } from "lucide-react";
import { Header } from "@/components/header";
import { Services } from "@/components/services";
import { Inquiry } from "@/components/inquiry";
import { Footer } from "@/components/footer";
import { ContactActions } from "@/components/contact-actions";
import { PhotoExample } from "@/components/photo-example";
const faqs = [
  [
    "Was kostet mein Auftrag?",
    "Jedes Vorhaben ist anders. Der Preis wird individuell abgestimmt. Beschreiben Sie uns die gewünschten Arbeiten, den Umfang und den Einsatzort, damit wir Ihren Auftrag einschätzen können.",
  ],
  [
    "In welchen Regionen ist L&S im Einsatz?",
    "Unser Servicegebiet ist Deutschland. Ob und wie wir Ihren Einsatzort bedienen können, klären wir individuell mit Ihnen. Bitte nennen Sie uns dafür Ihre Postleitzahl und den Ort.",
  ],
  [
    "Kann ich mehrere Leistungen kombinieren?",
    "Ja, fragen Sie die gewünschten Leistungen gemeinsam an – zum Beispiel Demontage mit Entsorgung oder Möbeltransport mit anschließendem Aufbau. Den genauen Umfang stimmen wir mit Ihnen ab.",
  ],
  [
    "Welche Angaben helfen bei meiner Anfrage?",
    "Hilfreich sind die gewünschte Leistung, Einsatzort, ungefähre Menge, Etage und Zugang sowie Ihr Wunschtermin. Fotos können Sie anschließend direkt in Ihrem E-Mail-Programm anhängen.",
  ],
  [
    "Wann kann ich Sie erreichen?",
    "Sie können uns rund um die Uhr per E-Mail kontaktieren. 24 Stunden erreichbar bedeutet nicht, dass jeder Einsatz sofort möglich ist. Termine vereinbaren wir persönlich mit Ihnen.",
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
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="small-line" /> ANPACKEN. ORDNUNG SCHAFFEN.
            </div>
            <h1>
              Wir schaffen Platz.
              <br />
              <span>
                Für das, was
                <br className="desktop-break" /> kommt.
              </span>
            </h1>
            <p>
              Entrümpelung, Demontage und Möbelservice.
              <br className="desktop-break" /> Wir übernehmen die Arbeit. Sie
              den nächsten Schritt.
            </p>
            <a href="#anfrage" className="button button-dark">
              Ihr Vorhaben anfragen <ArrowUpRight size={20} />
            </a>
            <a href="#leistungen" className="hero-more">
              Unsere Leistungen entdecken <ArrowDown size={16} />
            </a>
            <ContactActions compact />
            <div className="hero-availability">
              <span className="status-dot" />
              24 Stunden erreichbar <span className="divider">/</span> Einsatz
              nach Absprache
            </div>
          </div>
          <div className="hero-visual">
            <Image
              src={asset("/images/cleared-room.webp")}
              alt="Heller Raum mit Umzugskartons und vorbereiteten Möbelteilen – illustrative Darstellung"
              fill
              sizes="(max-width: 760px) 100vw, 52vw"
              priority
            />
            <div className="image-label">NEUER RAUM. NEUE MÖGLICHKEITEN.</div>
            <div className="hero-stamp">
              <ArrowUpRight size={38} strokeWidth={1.4} />
              <span>
                Weniger Ballast.
                <br />
                <strong>Mehr Freiraum.</strong>
              </span>
            </div>
            <span className="image-credit">Illustrative Darstellung</span>
          </div>
        </section>
        <div className="facts-bar">
          <div>
            <MapPin size={19} />
            <span>
              Deutschlandweit <small>nach Absprache</small>
            </span>
          </div>
          <div>
            <Clock3 size={19} />
            <span>
              24 Stunden <small>erreichbar</small>
            </span>
          </div>
          <div>
            <span className="fact-mark">↗</span>
            <span>
              Individuelles Angebot <small>für Ihr Vorhaben</small>
            </span>
          </div>
        </div>
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
            <p>
              Vom ersten Abbau bis zum letzten Möbelstück.
              <br />
              Einzelne Arbeiten oder mehrere Leistungen
              <br className="desktop-break" /> zusammen – passend zu Ihrem
              Vorhaben.
            </p>
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
            <p>
              Damit Sie wissen, was passiert, stimmen wir Umfang, Preis und
              Termin vor Beginn mit Ihnen ab.
            </p>
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
                <p>
                  Was soll weg, was soll mit? Teilen Sie uns mit, welche
                  Arbeiten Sie planen und wo Unterstützung gebraucht wird.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Wir klären die Details.</h3>
                <p>
                  Gemeinsam besprechen wir den Umfang, den Zugang und Ihren
                  Wunschtermin. Sie erhalten einen individuell abgestimmten
                  Preis.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Wir packen an.</h3>
                <p>
                  Zum vereinbarten Termin kümmern wir uns um die besprochenen
                  Arbeiten. Damit Ihr nächster Schritt beginnen kann.
                </p>
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
            <p>
              Hier finden Sie die ersten Antworten.
              <br />
              Alles Weitere klären wir persönlich.
            </p>
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
            <p>
              Erzählen Sie uns kurz von Ihrem Vorhaben.
              <br />
              Die Details besprechen wir gemeinsam.
            </p>
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
