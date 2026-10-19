import Image from "next/image";
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
import { asset } from "@/lib/base-path";
import { business, services } from "@/lib/content";
import { pairs } from "@/lib/gallery";

const serviceIcons = [PackageOpen, Recycle, Hammer, Truck, Sparkles];

// Owner-supplied photos: a fully cleared room, and a bathroom stripped back
// to the wall – clearance and dismantling, the two core services.
const mainPhoto = pairs.clearance.after;
const detailPhoto = {
  src: "/images/bathroom-after.webp",
  width: 800,
  height: 1067,
};

export function Hero() {
  const phone = business.phone.trim();
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="hero-label">Entrümpelung · Demontage · Transport</p>
          <h1 id="hero-title" lang="de">
            Mehr Platz.
            <br />
            <span>Weniger Stress.</span>
          </h1>
          <p className="hero-text" lang="de">
            Wir übernehmen die komplette Räumung – von der Planung bis zur
            besenreinen Übergabe.
          </p>
          <div className="hero-actions" lang="de">
            <a href="#anfrage" className="button button-orange">
              Unverbindlich anfragen <ArrowRight size={18} aria-hidden="true" />
            </a>
            {phone && (
              <a
                className="button button-outline"
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                aria-label={`Jetzt anrufen: ${phone}`}
              >
                <Phone size={18} aria-hidden="true" /> Jetzt anrufen
              </a>
            )}
          </div>
          <p className="hero-note" lang="de">
            <span aria-hidden="true" />
            Schnell, zuverlässig und stressfrei.
          </p>
        </div>
        <div className="hero-media">
          <figure className="hero-photo hero-photo-main">
            <Image
              src={asset(mainPhoto.src)}
              alt="Fully cleared room with bare wooden floor after a clearance"
              width={mainPhoto.width}
              height={mainPhoto.height}
              sizes="(max-width: 760px) 90vw, (max-width: 1100px) 60vw, 44vw"
              priority
            />
          </figure>
          <figure className="hero-photo hero-photo-detail">
            <Image
              src={asset(detailPhoto.src)}
              alt="Bathroom stripped back to the wall after tiles and fittings were dismantled"
              width={detailPhoto.width}
              height={detailPhoto.height}
              sizes="(max-width: 760px) 40vw, 18vw"
            />
          </figure>
        </div>
      </div>
    </section>
  );
}

// Service line-up, directly below the hero.
export function ServicesOverview() {
  return (
    <section className="hero-services" aria-labelledby="services-title">
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
