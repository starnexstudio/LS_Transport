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
  UserCheck,
} from "lucide-react";
import { asset } from "@/lib/base-path";
import { business, services } from "@/lib/content";

const serviceIcons = [PackageOpen, Recycle, Hammer, Truck, Sparkles];

// Availability and region live in the top bar; the hero names service qualities.
const facts = [
  { Icon: UserCheck, title: "One contact", text: "from start to finish" },
  { Icon: Recycle, title: "Professional", text: "disposal" },
  { Icon: Sparkles, title: "Swept clean", text: "at handover" },
];

export function Hero() {
  const phone = business.phone.trim();
  return (
    <section className="hero" aria-labelledby="hero-title">
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
          <h1 id="hero-title">
            Clearance
            <br />
            &amp; Dismantling.
            <span className="hero-accent">Done right.</span>
          </h1>
          {/* German wording as supplied by the owner. */}
          <div className="hero-lead" lang="de">
            <p className="hero-lead-title">
              Schnell, zuverlässig und stressfrei
            </p>
            <p className="hero-lead-text">
              Wir übernehmen die komplette Räumung – von der Planung bis zur
              besenreinen Übergabe.
            </p>
          </div>
          <div className="hero-actions">
            <a href="#anfrage" className="button button-orange">
              Request a quote <ArrowRight size={18} />
            </a>
            {phone && (
              <a
                className="button button-glass"
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              >
                <Phone size={18} /> {phone}
              </a>
            )}
          </div>
          <ul className="hero-facts">
            {facts.map(({ Icon, title, text }) => (
              <li key={title}>
                <span className="hero-fact-icon">
                  <Icon size={18} />
                </span>
                <span>
                  <strong>{title}</strong>
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <aside className="hero-card" aria-labelledby="hero-card-title">
          <p className="hero-card-label">Our services</p>
          <h2 className="hero-card-title" id="hero-card-title">
            All from one team
          </h2>
          <ol className="hero-card-list">
            {services.map((service, index) => {
              const Icon = serviceIcons[index];
              return (
                <li key={service.title}>
                  <span className="hero-card-icon" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span className="hero-card-text">
                    <strong>{service.title}</strong>
                    <small>{service.short}</small>
                  </span>
                  <span className="hero-card-number" aria-hidden="true">
                    0{index + 1}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="hero-card-note">
            <CircleCheck size={17} aria-hidden="true" />
            Combine any of them in one job.
          </p>
        </aside>
      </div>
    </section>
  );
}
