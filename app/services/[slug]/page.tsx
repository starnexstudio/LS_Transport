import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Inquiry } from "@/components/inquiry";
import { ContactActions } from "@/components/contact-actions";
import { MediaRow, type MediaItem } from "@/components/media-row";
import { services } from "@/lib/content";
import { pairs, photos } from "@/lib/gallery";
import { serviceDetails } from "@/lib/service-details";

// Photos shown under each service's intro, keyed by slug.
const media: Record<string, MediaItem[]> = {
  clearance: [{ pair: pairs.clearance, label: "Clearance" }],
  disposal: [
    { photo: photos.disposalFurniture },
    { photo: photos.disposalRecycling },
  ],
  dismantling: [
    { photo: photos.bathtubRemoval },
    { pair: pairs.bathroom, label: "Bathroom strip-out" },
  ],
  "furniture-transport": [
    { pair: pairs.bedroom, label: "Furniture removal" },
    { photo: photos.wrappedFurniture },
  ],
  cleaning: [
    { photo: photos.cleaningFloor },
    {
      photo: {
        ...pairs.bedroom.after,
        alt: "Empty, clean room ready for handover",
        caption: "Ready for handover",
      },
    },
  ],
};
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
        Skip to content
      </a>
      <Header />
      <main id="inhalt">
        <section className="service-page-intro section">
          <nav aria-label="Breadcrumb" className="breadcrumbs">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/services">Services</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{service.title}</span>
          </nav>
          <div className="service-page-heading">
            <div>
              <span className="eyebrow">L&S / SERVICE 0{index + 1}</span>
              <h1>{service.title}</h1>
              <p className="service-page-tagline">{service.short}</p>
            </div>
            <div className="service-page-summary">
              <p>{detail.introduction}</p>
              <a className="button button-dark" href="#anfrage">
                Request this service <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </section>
        <section
          className="section service-visual"
          aria-label={`${service.title} in pictures`}
        >
          <MediaRow items={media[slug]} />
        </section>
        <section className="section service-scope">
          <div>
            <span className="eyebrow">WHAT WE CAN TAKE ON</span>
            <h2>
              Your job.
              <br />
              Clearly agreed.
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
            <span className="eyebrow">WELL PREPARED</span>
            <h2>
              These details
              <br />
              help us most.
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
            <span className="eyebrow">PRICE & SCOPE</span>
            <h3>Tailored to your job.</h3>
            <p>{detail.priceFactors}</p>
            <details>
              <summary>{detail.question}</summary>
              <p>{detail.answer}</p>
            </details>
          </aside>
        </section>
        <section className="contact section" id="anfrage">
          <div className="contact-intro">
            <span className="eyebrow">LET'S SORT OUT THE DETAILS</span>
            <h2>
              Your job
              <br />
              starts here.
            </h2>
            <p>
              The service is already selected. Tell us briefly what you need.
            </p>
            <ContactActions />
            <p>
              Germany – exact service area by arrangement.
              <br />
              Available 24 hours a day.
            </p>
          </div>
          <Inquiry initialService={service.title} />
        </section>
        <section className="section related-services">
          <span className="eyebrow">RELATED</span>
          <h2>More services</h2>
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
