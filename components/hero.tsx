import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Hammer,
  MessageCircle,
  PackageOpen,
  Phone,
  Recycle,
  Sparkles,
  Truck,
} from "lucide-react";
import { asset } from "@/lib/base-path";
import { business, services } from "@/lib/content";
import { serviceDetails } from "@/lib/service-details";

const serviceIcons = [PackageOpen, Recycle, Hammer, Truck, Sparkles];

function QuickContact() {
  const phone = business.phone.trim();
  const whatsapp = business.whatsapp.trim();
  return (
    <>
      {phone && (
        <a
          className="button button-glass"
          href={`tel:${phone.replace(/[^+\d]/g, "")}`}
        >
          <Phone size={19} /> {phone}
        </a>
      )}
      {whatsapp && (
        <a
          className="button button-whatsapp"
          href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Guten Tag L&S, ich möchte ein Vorhaben anfragen.")}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={19} /> WhatsApp
        </a>
      )}
    </>
  );
}

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-visual" aria-hidden="true">
        <Image
          src={asset("/images/cleared-room.webp")}
          alt=""
          fill
          sizes="100vw"
          priority
        />
      </div>
      <div className="hero-inner">
        <div className="hero-copy">
          <div className="hero-pill">
            <span className="status-dot" /> 24 h erreichbar · Deutschlandweit
          </div>
          <h1>
            Entrümpelung
            <br />
            <span className="hero-accent">&amp; Demontage</span>
            <br />
            sauber erledigt.
          </h1>
          <p>
            Räumen, rückbauen, transportieren, reinigen – alles aus einer Hand.
          </p>
          <div className="hero-actions">
            <a href="#anfrage" className="button button-orange">
              Jetzt anfragen <ArrowRight size={19} />
            </a>
            <QuickContact />
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-badge">
            Alles aus
            <br />
            einer Hand
            <small>Von der Räumung bis zur Reinigung</small>
          </div>
          <ul>
            {services.map((service, index) => {
              const Icon = serviceIcons[index];
              return (
                <li key={service.title}>
                  <Link href={`/services/${serviceDetails[index].slug}`}>
                    <Icon size={20} />
                    {service.title}
                    <ArrowUpRight size={17} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="hero-facts">
            <div>
              <strong>24 h</strong>erreichbar
            </div>
            <div>
              <strong>DE</strong>deutschlandweit
            </div>
            <div>
              <strong>1</strong>Ansprechpartner
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
