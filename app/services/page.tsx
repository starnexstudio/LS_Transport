import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { services } from "@/lib/content";
import { serviceDetails } from "@/lib/service-details";
export const metadata: Metadata = {
  title: "Alle Leistungen | L&S",
  description:
    "Entrümpelung, fachgerechte Entsorgung, Demontage, Möbeltransport und Möbelmontage: Erfahren Sie, was wir übernehmen und welche Angaben bei Ihrer Anfrage helfen.",
};
export default function ServiceOverview() {
  return (
    <>
      <a href="#inhalt" className="skip-link">
        Zum Inhalt springen
      </a>
      <Header />
      <main id="inhalt" className="section service-overview">
        <Link href="/" className="text-link">
          ← Zur Startseite
        </Link>
        <span className="eyebrow">L&S / UNSERE LEISTUNGEN</span>
        <h1>
          Was Sie vorhaben.
          <br />
          Was wir beitragen.
        </h1>
        <p>
          Erfahren Sie mehr über Umfang, Vorbereitung und Preisgestaltung.
          Einzelne Leistungen lassen sich nach Absprache miteinander verbinden.
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
