import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Inquiry } from "@/components/inquiry";
import { ContactActions } from "@/components/contact-actions";
import { services } from "@/lib/content";
import { serviceDetails } from "@/lib/service-details";
export const dynamicParams = false;
export function generateStaticParams() {
  return serviceDetails.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const index = serviceDetails.findIndex((detail) => detail.slug === slug);
  if (index < 0) return {};
  return {
    title: `${services[index].title} | L&S`,
    description: serviceDetails[index].introduction,
  };
}
export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = serviceDetails.findIndex((detail) => detail.slug === slug);
  if (index < 0) notFound();
  const detail = serviceDetails[index],
    service = services[index];
  return (
    <>
      <a href="#inhalt" className="skip-link">
        Zum Inhalt springen
      </a>
      <Header />
      <main id="inhalt">
        <section className="service-page-intro section">
          <nav aria-label="Brotkrümelnavigation" className="breadcrumbs">
            <Link href="/">Startseite</Link>
            <span aria-hidden="true">/</span>
            <Link href="/services">Leistungen</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{service.title}</span>
          </nav>
          <div className="service-page-heading">
            <div>
              <span className="eyebrow">L&S / LEISTUNG 0{index + 1}</span>
              <h1>{service.title}</h1>
              <p className="service-page-tagline">{service.short}</p>
            </div>
            <div className="service-page-summary">
              <p>{detail.introduction}</p>
              <a className="button button-dark" href="#anfrage">
                Diese Leistung anfragen <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </section>
        <section className="section service-scope">
          <div>
            <span className="eyebrow">DAS KÖNNEN WIR ÜBERNEHMEN</span>
            <h2>
              Ihr Auftrag.
              <br />
              Klar abgestimmt.
            </h2>
          </div>
          <div>
            {detail.scope.map((item, itemIndex) => (
              <article key={item.title}>
                <span className="service-number">0{itemIndex + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="section service-planning">
          <div>
            <span className="eyebrow">GUT VORBEREITET</span>
            <h2>
              Diese Angaben
              <br />
              helfen uns weiter.
            </h2>
            <ul>
              {detail.preparation.map((item) => (
                <li key={item}>
                  <Check size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <aside>
            <span className="eyebrow">PREIS & UMFANG</span>
            <h3>Passend zu Ihrem Vorhaben.</h3>
            <p>{detail.priceFactors}</p>
            <p>
              Der genaue Preis und die enthaltenen Leistungen werden vor Beginn
              individuell abgestimmt.
            </p>
            <details>
              <summary>{detail.question}</summary>
              <p>{detail.answer}</p>
            </details>
          </aside>
        </section>
        <section className="contact section" id="anfrage">
          <div className="contact-intro">
            <span className="eyebrow">LASSEN SIE UNS DIE DETAILS KLÄREN</span>
            <h2>
              Ihr Vorhaben
              <br />
              beginnt hier.
            </h2>
            <p>
              Die Leistung ist bereits vorausgewählt. Beschreiben Sie kurz, was
              Sie planen und wo wir Sie unterstützen dürfen.
            </p>
            <ContactActions />
            <p>
              Deutschland – genauer Einsatzbereich nach Absprache.
              <br />
              24 Stunden erreichbar.
            </p>
          </div>
          <Inquiry initialService={service.title} />
        </section>
        <section className="section related-services">
          <span className="eyebrow">PASSEND DAZU</span>
          <h2>Weitere Leistungen</h2>
          <div>
            {services.map(
              (related, relatedIndex) =>
                relatedIndex !== index && (
                  <Link
                    key={related.title}
                    href={`/services/${serviceDetails[relatedIndex].slug}`}
                  >
                    {related.title}
                    <ArrowRight size={18} />
                  </Link>
                ),
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
