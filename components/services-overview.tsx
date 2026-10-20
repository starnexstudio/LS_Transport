"use client";
import { useRef, useState } from "react";
import {
  ArrowLeft,
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
const number = (index: number) => String(index + 1).padStart(2, "0");

// Service line-up below the hero. Each card opens a dialog with the full
// description and checklist; visitors can browse to the other services from
// there, request one (preselected in the inquiry form) or call.
export function ServicesOverview() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const phone = business.phone.trim();
  const service = services[active];
  const Icon = serviceIcons[active];
  const previous = (active + services.length - 1) % services.length;
  const next = (active + 1) % services.length;

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
                  {number(index)}
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
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") setActive(next);
          if (event.key === "ArrowLeft") setActive(previous);
        }}
      >
        <div className="service-dialog-panel">
          <button
            type="button"
            className="service-dialog-close"
            aria-label="Schließen"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} aria-hidden="true" />
          </button>
          <div className="service-dialog-intro">
            <span className="service-dialog-handle" aria-hidden="true" />
            <span className="service-dialog-index" aria-hidden="true">
              {number(active)}
            </span>
            {/* Keyed so the intro animates in again when browsing. */}
            <div key={active} className="service-dialog-heading">
              <span className="service-dialog-icon" aria-hidden="true">
                <Icon size={24} strokeWidth={1.75} />
              </span>
              <h3 id="service-dialog-title">{service.title}</h3>
              <p className="service-dialog-short">{service.short}</p>
            </div>
            <div className="service-dialog-nav">
              <button
                type="button"
                aria-label={`Vorherige Leistung: ${services[previous].title}`}
                onClick={() => setActive(previous)}
              >
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
              <span aria-hidden="true">
                {number(active)} <i>/</i> {number(services.length - 1)}
              </span>
              <button
                type="button"
                aria-label={`Nächste Leistung: ${services[next].title}`}
                onClick={() => setActive(next)}
              >
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div key={active} className="service-dialog-content">
            <p className="service-dialog-text">{service.text}</p>
            <h4>Das gehört dazu</h4>
            <ul className="service-dialog-list">
              {service.items.map((item) => (
                <li key={item}>
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="service-dialog-note">
              <CircleCheck size={16} aria-hidden="true" />
              Beliebig in einem Auftrag kombinierbar
            </p>
          </div>
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
