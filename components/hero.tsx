import {
  ArrowRight,
  CircleCheck,
  Hammer,
  PackageOpen,
  Phone,
  Recycle,
  Sparkles,
  Truck,
} from "lucide-react";
import { HeroRoom } from "@/components/hero-room";
import { business, services } from "@/lib/content";

const serviceIcons = [PackageOpen, Recycle, Hammer, Truck, Sparkles];

// Copy stays still while the room beside it is cleared. The headline breaks
// differently per layout, so the line breaks are switched in hero.css.
export function Hero() {
  const phone = business.phone.trim();
  return (
    <section className="hero" aria-labelledby="hero-title" lang="de">
      <div className="hero-inner">
        <div className="hero-copy">
          <p className="hero-label">Entrümpelung · Demontage · Transport</p>
          <h1 id="hero-title">
            Wir machen
            <br className="hero-break-1" /> Platz
            <br className="hero-break-2" /> für
            <br className="hero-break-3" /> Neues.
          </h1>
          <p className="hero-text">
            Wir übernehmen die komplette Räumung – von der Planung bis zur
            besenreinen Übergabe.
          </p>
        </div>
        <div className="hero-actions">
          <a href="#anfrage" className="hero-button hero-button-primary">
            Unverbindlich anfragen
            <ArrowRight
              size={18}
              strokeWidth={1.8333}
              absoluteStrokeWidth
              aria-hidden="true"
            />
          </a>
          {phone && (
            <a
              className="hero-button hero-button-outline"
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              aria-label={`Jetzt anrufen: ${phone}`}
            >
              <Phone
                size={17}
                strokeWidth={1.5}
                absoluteStrokeWidth
                aria-hidden="true"
              />
              Jetzt anrufen
            </a>
          )}
        </div>
        <HeroRoom />
        <p className="hero-note">
          <span aria-hidden="true" />
          Schnell, zuverlässig und stressfrei.
        </p>
      </div>
    </section>
  );
}

// Service line-up, directly below the hero.
export function ServicesOverview() {
  return (
    <section
      className="hero-services"
      id="leistungen"
      aria-labelledby="services-title"
    >
      <div className="hero-services-head">
        <div>
          <p className="hero-card-label">Our services</p>
          <h2 className="hero-card-title" id="services-title">
            All from one team
          </h2>
        </div>
        <p className="hero-services-note">
          <CircleCheck size={16} aria-hidden="true" />
          Combine any of them in one job
        </p>
      </div>
      <ol className="hero-services-grid">
        {services.map((service, index) => {
          const Icon = serviceIcons[index];
          return (
            <li key={service.title} className="hero-service-card">
              <span className="hero-service-number" aria-hidden="true">
                0{index + 1}
              </span>
              <span className="hero-service-icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <strong>{service.title}</strong>
              <p>{service.short}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
