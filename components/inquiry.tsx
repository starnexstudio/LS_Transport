"use client";
import { useEffect, useState } from "react";
import { services, business } from "@/lib/content";
// Static hosting has no server, so FormSubmit forwards each request to the
// business inbox. The first request triggers a one-time activation email there.
const endpoint = `https://formsubmit.co/ajax/${business.email.toLowerCase()}`;
type Status = "idle" | "sending" | "sent" | "failed";
export function Inquiry({ initialService = "" }: { initialService?: string }) {
  const [service, setService] = useState(initialService);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [mailto, setMailto] = useState("");
  useEffect(() => {
    const handler = (e: Event) => setService((e as CustomEvent<string>).detail);
    window.addEventListener("service-select", handler);
    return () => window.removeEventListener("service-select", handler);
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const name = String(f.get("name") ?? "").trim(),
      phone = String(f.get("phone") ?? "").trim(),
      place = String(f.get("place") ?? "").trim(),
      message = String(f.get("message") ?? "").trim();
    const next: Record<string, string> = {};
    if (!service) next.service = "Bitte wählen Sie eine Leistung aus.";
    if (!name) next.name = "Bitte geben Sie Ihren Namen ein.";
    if (!place) next.place = "Bitte geben Sie den Einsatzort ein.";
    if (phone && !/^\+?[\d\s()\/-]{6,}$/.test(phone))
      next.phone = "Bitte geben Sie eine gültige Telefonnummer ein.";
    if (!message) next.message = "Bitte beschreiben Sie Ihren Auftrag kurz.";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    const text = `Hallo L&S,\n\nich möchte ein Angebot für folgenden Auftrag anfragen:\n\nLeistung: ${service}\nName: ${name}\nTelefon: ${phone || "–"}\nEinsatzort: ${place}\n\n${message}\n\nMit freundlichen Grüßen\n${name}`;
    const subject = `Anfrage: ${service} – ${name}`;
    setMailto(
      `mailto:${business.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
    );
    setStatus("sending");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          Leistung: service,
          Name: name,
          Telefon: phone || "–",
          Einsatzort: place,
          Nachricht: message,
          _subject: subject,
          _template: "table",
          _captcha: "false",
          _honey: String(f.get("_honey") ?? ""),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) !== "true") throw new Error();
      setStatus("sent");
      form.reset();
      setService("");
    } catch {
      setStatus("failed");
    }
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
          <label htmlFor="phone">Telefonnummer</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={40}
            placeholder="Für Rückfragen (optional)"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone && (
            <span className="error" id="phone-error">
              {errors.phone}
            </span>
          )}
        </div>
      </div>
      <div>
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
      {/* Hidden from people; bots that fill it are dropped by FormSubmit. */}
      <input
        type="text"
        name="_honey"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="form-honey"
      />
      <button
        className="button button-dark"
        type="submit"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Wird gesendet …" : "Senden"}
      </button>
      <p className="form-status" role="status" aria-live="polite">
        {status === "sent" &&
          "Vielen Dank! Ihre Anfrage ist bei uns eingegangen. Wir melden uns schnellstmöglich."}
        {status === "failed" && (
          <>
            Die Anfrage konnte nicht gesendet werden.{" "}
            <a href={mailto}>Bitte per E-Mail senden</a> an {business.email}.
          </>
        )}
      </p>
    </form>
  );
}
