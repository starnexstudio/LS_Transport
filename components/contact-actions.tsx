import { Mail, MessageCircle, Phone } from "lucide-react";
import { business, whatsappGreeting } from "@/lib/content";
export function ContactActions({ compact = false }: { compact?: boolean }) {
  const phone = business.phone.trim();
  const whatsapp = business.whatsapp.trim();
  if (compact && !phone && !whatsapp) return null;
  return (
    <div
      className={compact ? "direct-contact compact" : "direct-contact"}
      aria-label="Direkter Kontakt"
    >
      {phone && (
        <a
          aria-label={`L&S anrufen: ${phone}`}
          className="contact-call"
          href={`tel:${phone.replace(/[^+\d]/g, "")}`}
        >
          <Phone size={18} />
          <span>{compact ? "Anrufen" : phone}</span>
        </a>
      )}
      {whatsapp && (
        <a
          aria-label="L&S per WhatsApp schreiben (öffnet in neuem Tab)"
          className="contact-whatsapp"
          href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappGreeting)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={18} />
          <span>Per WhatsApp schreiben</span>
        </a>
      )}
      {!compact && (
        <a className="contact-mail" href={`mailto:${business.email}`}>
          <Mail size={18} />
          <span>E-Mail senden</span>
        </a>
      )}
    </div>
  );
}
