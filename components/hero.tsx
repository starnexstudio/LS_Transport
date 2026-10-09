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
import { pairs } from "@/lib/gallery";
import { CompareSlider } from "@/components/compare-slider";

const serviceIcons = [PackageOpen, Recycle, Hammer, Truck, Sparkles];

// Availability and region live in the top bar; these name service qualities.
const facts = [
  { Icon: UserCheck, title: "One contact", text: "from start to finish" },
  { Icon: Recycle, title: "Professional", text: "disposal" },
  { Icon: Sparkles, title: "Swept clean", text: "at handover" },
];

// Proof, not just a photo: the same clearance pair shown again further down
// the page, led with here so the claim is visible before anyone scrolls.
const heroPair = {
  label: "Clearance",
  width: pairs.clearance.before.width,
  height: pairs.clearance.before.height,
  before: pairs.clearance.before,
  after: pairs.clearance.after,
};

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
      <div className="hero-glow hero-glow-a" aria-hidden="true" />
      <div className="hero-glow hero-glow-b" aria-hidden="true" />
      <div className="hero-inner">
        <div className="hero-copy">
          <p className="hero-badge">
            <span className="hero-badge-dot" aria-hidden="true" />
            {services.length} services, one team
          </p>
          <h1 id="hero-title">
            Clearance
            <br />
            &amp; Dismantling.
            <span className="hero-accent">Done right.</span>
          </h1>
          <div className="hero-lead">
            <p className="hero-lead-title">Fast, reliable and stress-free</p>
            <p className="hero-lead-text">
              We take care of the entire clearance – from planning to a
              swept-clean handover.
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
        <div className="hero-visual-col">
          <div className="hero-visual-frame">
            <CompareSlider pair={heroPair} />
          </div>
          <p className="hero-visual-caption">
            <strong>Clearance.</strong> From cluttered to cleared.
          </p>
        </div>
      </div>
      <div className="hero-services">
        <div className="hero-services-head">
          <div>
            <p className="hero-card-label">Our services</p>
            <h2 className="hero-card-title">All from one team</h2>
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
      </div>
    </section>
  );
}
