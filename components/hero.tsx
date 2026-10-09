import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
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
import { serviceDetails } from "@/lib/service-details";

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
          <p className="hero-eyebrow">Fast · Reliable · Clean</p>
          <h1 id="hero-title">
            Clearance
            <br />
            &amp; Dismantling.
            <span className="hero-accent">Done right.</span>
          </h1>
          <p className="hero-lead">
            Clearing, dismantling, transport and cleaning – all from one team.
          </p>
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
        <aside className="hero-card" aria-label="Our services">
          <p className="hero-card-label">Our services</p>
          <p className="hero-card-title">All from one team</p>
          <ul>
            {services.map((service, index) => {
              const Icon = serviceIcons[index];
              return (
                <li key={service.title}>
                  <Link href={`/services/${serviceDetails[index].slug}`}>
                    <span className="hero-card-icon">
                      <Icon size={19} />
                    </span>
                    <span className="hero-card-text">
                      <strong>{service.title}</strong>
                      <small>{service.short}</small>
                    </span>
                    <ArrowUpRight size={18} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link className="hero-card-all" href="/services">
            All services in detail <ArrowRight size={17} />
          </Link>
        </aside>
      </div>
    </section>
  );
}
