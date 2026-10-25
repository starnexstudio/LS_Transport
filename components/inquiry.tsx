"use client";
import { useEffect, useState } from "react";
import { services, business } from "@/lib/content";
export function Inquiry({ initialService = "" }: { initialService?: string }) {
  const [service, setService] = useState(initialService);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    const handler = (e: Event) => setService((e as CustomEvent<string>).detail);
    window.addEventListener("service-select", handler);
    return () => window.removeEventListener("service-select", handler);
  }, []);
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim(),
      place = String(f.get("place") ?? "").trim(),
      message = String(f.get("message") ?? "").trim();
    const next: Record<string, string> = {};
    if (!service) next.service = "Bitte wählen Sie eine Leistung aus.";
    if (!name) next.name = "Bitte geben Sie Ihren Namen ein.";
    if (!place) next.place = "Bitte geben Sie den Einsatzort ein.";
    if (!message) next.message = "Bitte beschreiben Sie Ihren Auftrag kurz.";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    const text = `Hallo L&S,\n\nich möchte ein Angebot für folgenden Auftrag anfragen:\n\nLeistung: ${service}\nName: ${name}\nEinsatzort: ${place}\n\n${message}\n\nMit freundlichen Grüßen\n${name}`;
    window.open(
      `https://wa.me/${business.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
  return (
    <form className="inquiry" noValidate onSubmit={submit}>
      <div className="form-heading">
        <span>Ihre Anfrage</span>
        <small>* Pflichtfelder</small>
      </div>
      <label htmlFor="service">Wie können wir helfen? *</label>
      <select
        id="service"
        name="service"
        value={service}
        required
        onChange={(e) => setService(e.target.value)}
        aria-invalid={!!errors.service}
        aria-describedby={errors.service ? "service-error" : undefined}
      >
        <option value="">Leistung auswählen</option>
        {services.map((s) => (
          <option key={s.title}>{s.title}</option>
        ))}
        <option>Mehrere Leistungen / Sonstiges</option>
      </select>
      {errors.service && (
        <span className="error" id="service-error">
          {errors.service}
        </span>
      )}
      <div className="form-grid">
        <div>
          <label htmlFor="name">Ihr Name *</label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            maxLength={120}
            required
            placeholder="Vor- und Nachname"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <span className="error" id="name-error">
              {errors.name}
            </span>
          )}
        </div>
        <div>
          <label htmlFor="place">Einsatzort *</label>
          <input
            id="place"
            name="place"
            autoComplete="address-level2"
            maxLength={160}
            required
            placeholder="PLZ und Ort"
            aria-invalid={!!errors.place}
            aria-describedby={errors.place ? "place-error" : undefined}
          />
          {errors.place && (
            <span className="error" id="place-error">
              {errors.place}
            </span>
          )}
        </div>
      </div>
      <label htmlFor="message">Ihr Auftrag in wenigen Worten *</label>
      <textarea
        id="message"
        name="message"
        rows={3}
        maxLength={2500}
        required
        placeholder="Was ist zu tun? Ungefähre Menge, Stockwerk und Wunschtermin …"
        aria-invalid={!!errors.message}
        aria-describedby={errors.message ? "message-error" : undefined}
      />
      {errors.message && (
        <span className="error" id="message-error">
          {errors.message}
        </span>
      )}
      <button className="button button-dark" type="submit">
        Senden
      </button>
    </form>
  );
}
