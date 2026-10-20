"use client";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleCheck,
  Hammer,
  PackageOpen,
  Phone,
  Plus,
  Recycle,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { business, services } from "@/lib/content";

const serviceIcons = [PackageOpen, Recycle, Hammer, Truck, Sparkles];

// Service line-up below the hero. Each card opens a dialog with the full
// description and checklist; from there the visitor can request that service
// (preselected in the inquiry form) or call.
export function ServicesOverview() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const phone = business.phone.trim();
  const service = services[active];
  const Icon = serviceIcons[active];

  function open(index: number) {
    setActive(index);
    dialog.current?.showModal();
  }

  function request() {
    window.dispatchEvent(
      new CustomEvent("service-select", { detail: service.title }),
    );
    dialog.current?.close();
    document.getElementById("anfrage")?.scrollIntoView();
  }

  return (
    <section
      className="hero-services"
      id="leistungen"
      aria-labelledby="services-title"
    >
      <div className="hero-services-head">
        <div>
          <p className="hero-card-label">Unsere Leistungen</p>
          <h2 className="hero-card-title" id="services-title">
            Alles aus einer Hand
          </h2>
        </div>
        <p className="hero-services-note">
          <CircleCheck size={16} aria-hidden="true" />
          Beliebig in einem Auftrag kombinierbar
        </p>
      </div>
      <ol className="hero-services-grid">
        {services.map((item, index) => {
          const CardIcon = serviceIcons[index];
          return (
            <li key={item.title}>
              <button
                type="button"
                className="hero-service-card"
                aria-haspopup="dialog"
                onClick={() => open(index)}
              >
                <span className="hero-service-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <span className="hero-service-icon" aria-hidden="true">
                  <CardIcon size={22} />
                </span>
                <strong>{item.title}</strong>
                <span className="hero-service-short">{item.short}</span>
                <span className="hero-service-more">
                  Details ansehen
                  <Plus size={15} aria-hidden="true" />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <dialog
        ref={dialog}
        className="service-dialog"
        aria-labelledby="service-dialog-title"
        onClick={(event) => {
          // A click on the backdrop lands on the dialog element itself.
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="service-dialog-body">
          <div className="service-dialog-head">
            <span className="hero-service-icon" aria-hidden="true">
              <Icon size={22} />
            </span>
            <span className="service-dialog-number" aria-hidden="true">
              0{active + 1} / 0{services.length}
            </span>
            <button
              type="button"
              className="service-dialog-close"
              aria-label="Schließen"
              onClick={() => dialog.current?.close()}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <h3 id="service-dialog-title">{service.title}</h3>
          <p className="service-dialog-short">{service.short}</p>
          <p className="service-dialog-text">{service.text}</p>
          <h4>Das gehört dazu</h4>
          <ul className="service-dialog-list">
            {service.items.map((item) => (
              <li key={item}>
                <Check size={16} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <div className="service-dialog-actions">
            <button
              type="button"
              className="hero-button hero-button-primary"
              onClick={request}
            >
              Diese Leistung anfragen
              <ArrowRight
                size={18}
                strokeWidth={1.8333}
                absoluteStrokeWidth
                aria-hidden="true"
              />
            </button>
            {phone && (
              <a
                className="service-dialog-call"
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
        </div>
      </dialog>
    </section>
  );
}
