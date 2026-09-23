"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Copy, Mail } from "lucide-react";
import { services, business } from "@/lib/content";
export function Inquiry({ initialService = "" }: { initialService?: string }) {
  const [service, setService] = useState(initialService);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
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
    if (!name) next.name = "Bitte geben Sie Ihren Namen an.";
    if (!place) next.place = "Bitte nennen Sie Ihren Einsatzort.";
    if (!message) next.message = "Bitte beschreiben Sie kurz Ihr Vorhaben.";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    setDraft(
      `Guten Tag L&S,\n\nich möchte folgendes Vorhaben anfragen:\n\nLeistung: ${service}\nName: ${name}\nEinsatzort: ${place}\n\n${message}\n\nMit freundlichen Grüßen\n${name}`,
    );
    setCopied(false);
  }
  return (
    <form className="inquiry" noValidate onSubmit={submit}>
      <div className="form-heading">
        <span>Ihre Anfrage</span>
        <small>* Pflichtfelder</small>
      </div>
      <label htmlFor="service">Wobei können wir helfen? *</label>
      <select
        id="service"
        name="service"
        value={service}
        onChange={(e) => {
          setService(e.target.value);
          setDraft("");
        }}
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
            placeholder="Vor- und Nachname"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            onChange={() => setDraft("")}
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
            placeholder="PLZ und Ort"
            aria-invalid={!!errors.place}
            aria-describedby={errors.place ? "place-error" : undefined}
            onChange={() => setDraft("")}
          />
          {errors.place && (
            <span className="error" id="place-error">
              {errors.place}
            </span>
          )}
        </div>
      </div>
      <label htmlFor="message">Ihr Vorhaben in wenigen Worten *</label>
      <textarea
        id="message"
        name="message"
        rows={3}
        maxLength={2500}
        placeholder="Was steht an? Ungefähre Menge, Etage und Wunschtermin …"
        aria-invalid={!!errors.message}
        aria-describedby={errors.message ? "message-error" : undefined}
        onChange={() => setDraft("")}
      />
      {errors.message && (
        <span className="error" id="message-error">
          {errors.message}
        </span>
      )}
      <p className="form-hint">
        Ihre Angaben bleiben zunächst in Ihrem Browser. Im nächsten Schritt
        öffnen Sie den Entwurf in Ihrem E-Mail-Programm und senden ihn selbst
        ab.
      </p>
      <button className="button button-dark" type="submit">
        E-Mail-Anfrage vorbereiten <ArrowUpRight size={19} />
      </button>
      {draft && (
        <div className="draft" role="status">
          <h3>
            <Check size={18} /> Ihr Entwurf ist bereit.
          </h3>
          <p>
            Es wurde noch nichts gesendet. Öffnen Sie Ihr E-Mail-Programm oder
            kopieren Sie den Text. Fotos können Sie dort ergänzen.
          </p>
          <div className="draft-actions">
            <a
              className="text-link"
              href={`mailto:${business.email}?subject=${encodeURIComponent("Projektanfrage – " + service)}&body=${encodeURIComponent(draft)}`}
            >
              <Mail size={16} /> E-Mail öffnen
            </a>
            <button
              type="button"
              className="text-link"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(draft);
                  setCopied(true);
                } catch {
                  setCopied(false);
                  setErrors({
                    ...errors,
                    copy: "Kopieren nicht möglich. Markieren Sie den Text im Feld unten.",
                  });
                }
              }}
            >
              <Copy size={16} />
              {copied ? "Text kopiert" : "Text kopieren"}
            </button>
          </div>
          <details>
            <summary>Anfragetext anzeigen</summary>
            <textarea
              aria-label="Vorbereiteter Anfragetext"
              readOnly
              value={draft}
              rows={9}
            />
          </details>
          {errors.copy && <p>{errors.copy}</p>}
        </div>
      )}
    </form>
  );
}
