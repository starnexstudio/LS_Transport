import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Inquiry } from "@/components/inquiry";
import { Footer } from "@/components/footer";
import { ContactActions } from "@/components/contact-actions";
import { PhotoExample } from "@/components/photo-example";
import { BeforeAfter } from "@/components/before-after";
const faqs = [
  [
    "How much will my job cost?",
    "The price depends on the scope and the work involved. Briefly describe your job and you'll receive an individual quote.",
  ],
  [
    "Which areas does L&S cover?",
    "All of Germany, by arrangement. Just tell us the postcode and town.",
  ],
  [
    "Can I combine several services?",
    "Yes – for example clearance, disposal and cleaning in one job.",
  ],
  [
    "Which details help with my request?",
    "The service, location, approximate amount, floor and preferred date. Photos are especially helpful.",
  ],
  [
    "When can I reach you?",
    "Around the clock. We arrange the date for the job with you personally.",
  ],
];
export default function Home() {
  return (
    <>
      <a href="#inhalt" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="inhalt">
        <Hero />
        <section className="process section" id="ablauf">
          <div className="process-intro">
            <span className="eyebrow">01 / A CLEAR PROCESS</span>
            <h2>
              A good start:
              <br />
              <span>a clear conversation.</span>
            </h2>
            <p>Three steps – no surprises.</p>
            <a href="#anfrage" className="text-link">
              Let&apos;s get started <ArrowUpRight size={18} />
            </a>
            <div className="process-wordmark" aria-hidden="true">
              L<span>&</span>S<span className="wordmark-dot">.</span>
            </div>
          </div>
          <ol className="process-steps">
            <li>
              <span>01</span>
              <div>
                <h3>You tell us. We listen.</h3>
                <p>Briefly describe what needs doing – photos are welcome.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>We clarify the details.</h3>
                <p>Scope, date and price – firmly agreed.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>We get to work.</h3>
                <p>On time for the appointment. Handed over swept clean.</p>
              </div>
            </li>
          </ol>
        </section>
        <BeforeAfter />
        <PhotoExample />
        <section className="questions section" id="fragen">
          <div>
            <span className="eyebrow">02 / GOOD TO KNOW</span>
            <h2>
              Still have
              <br />a question?
            </h2>
            <p>We&apos;ll clarify everything else with you personally.</p>
            <a
              className="text-link"
              href="mailto:Info@entruempelung-demontage.de"
            >
              Write to us <ArrowUpRight size={18} />
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
            <span className="eyebrow">03 / YOUR NEXT STEP</span>
            <h2>
              What can we
              <br />
              take on for you?
            </h2>
            <p>Describe it briefly – we&apos;ll get back to you.</p>
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
                Available 24 hours a day
                <br />
                <small>Germany – service area by arrangement</small>
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
