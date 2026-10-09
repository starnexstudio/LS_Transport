import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { services } from "@/lib/content";
import { serviceDetails } from "@/lib/service-details";
export const metadata: Metadata = {
  title: "All services | L&S",
  description:
    "Clearance, professional disposal, dismantling, furniture transport and cleaning: find out what we take on and which details help with your request.",
};
export default function ServiceOverview() {
  return (
    <>
      <a href="#inhalt" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="inhalt" className="section service-overview">
        <Link href="/" className="text-link">
          ← Back to home
        </Link>
        <span className="eyebrow">L&S / OUR SERVICES</span>
        <h1>
          What you have planned.
          <br />
          What we bring to it.
        </h1>
        <p>
          Learn more about scope, preparation and pricing. Individual services
          can be combined by arrangement.
        </p>
        <div className="service-overview-list">
          {services.map((service, index) => (
            <Link
              key={service.title}
              href={`/services/${serviceDetails[index].slug}`}
            >
              <span className="service-number">0{index + 1}</span>
              <div>
                <h2>{service.title}</h2>
                <p>{service.short}</p>
              </div>
              <ArrowUpRight />
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
