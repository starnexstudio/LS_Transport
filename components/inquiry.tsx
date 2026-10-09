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
    if (!service) next.service = "Please select a service.";
    if (!name) next.name = "Please enter your name.";
    if (!place) next.place = "Please enter the job location.";
    if (!message) next.message = "Please briefly describe your job.";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(Object.keys(next)[0])?.focus();
      return;
    }
    setDraft(
      `Hello L&S,\n\nI would like to request a quote for the following job:\n\nService: ${service}\nName: ${name}\nLocation: ${place}\n\n${message}\n\nKind regards\n${name}`,
    );
    setCopied(false);
  }
  return (
    <form className="inquiry" noValidate onSubmit={submit}>
      <div className="form-heading">
        <span>Your request</span>
        <small>* Required fields</small>
      </div>
      <label htmlFor="service">How can we help? *</label>
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
        <option value="">Select a service</option>
        {services.map((s) => (
          <option key={s.title}>{s.title}</option>
        ))}
        <option>Several services / other</option>
      </select>
      {errors.service && (
        <span className="error" id="service-error">
          {errors.service}
        </span>
      )}
      <div className="form-grid">
        <div>
          <label htmlFor="name">Your name *</label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            maxLength={120}
            placeholder="First and last name"
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
          <label htmlFor="place">Job location *</label>
          <input
            id="place"
            name="place"
            autoComplete="address-level2"
            maxLength={160}
            placeholder="Postcode and town"
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
      <label htmlFor="message">Your job in a few words *</label>
      <textarea
        id="message"
        name="message"
        rows={3}
        maxLength={2500}
        placeholder="What needs doing? Approximate amount, floor and preferred date …"
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
        Your details stay in your browser for now. In the next step, you open
        the draft in your email app and send it yourself.
      </p>
      <button className="button button-dark" type="submit">
        Prepare email request <ArrowUpRight size={19} />
      </button>
      {draft && (
        <div className="draft" role="status">
          <h3>
            <Check size={18} /> Your draft is ready.
          </h3>
          <p>
            Nothing has been sent yet. Open your email app or copy the text. You
            can add photos there.
          </p>
          <div className="draft-actions">
            <a
              className="text-link"
              href={`mailto:${business.email}?subject=${encodeURIComponent("Quote request – " + service)}&body=${encodeURIComponent(draft)}`}
            >
              <Mail size={16} /> Open email
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
                    copy: "Copying isn't possible. Please select the text in the field below.",
                  });
                }
              }}
            >
              <Copy size={16} />
              {copied ? "Text copied" : "Copy text"}
            </button>
          </div>
          <details>
            <summary>Show request text</summary>
            <textarea
              aria-label="Prepared request text"
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
