import { Mail, MessageCircle, Phone } from "lucide-react";
import { business, whatsappGreeting } from "@/lib/content";
export function ContactActions({ compact = false }: { compact?: boolean }) {
  const phone = business.phone.trim();
  const whatsapp = business.whatsapp.trim();
  if (compact && !phone && !whatsapp) return null;
  return (
    <div
      className={compact ? "direct-contact compact" : "direct-contact"}
      aria-label="Direct contact"
    >
      {phone && (
        <a
          aria-label={`Call L&S: ${phone}`}
          className="contact-call"
          href={`tel:${phone.replace(/[^+\d]/g, "")}`}
        >
          <Phone size={18} />
          <span>{compact ? "Call" : phone}</span>
        </a>
      )}
      {whatsapp && (
        <a
          aria-label="Message L&S on WhatsApp (opens in a new tab)"
          className="contact-whatsapp"
          href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappGreeting)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={18} />
          <span>Message on WhatsApp</span>
        </a>
      )}
      {!compact && (
        <a className="contact-mail" href={`mailto:${business.email}`}>
          <Mail size={18} />
          <span>Send an email</span>
        </a>
      )}
    </div>
  );
}
