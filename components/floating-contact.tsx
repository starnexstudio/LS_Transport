import { MessageCircle, Phone } from "lucide-react";
import { business, whatsappGreeting } from "@/lib/content";

// Always-visible quick contact on every page.
export function FloatingContact() {
  const phone = business.phone.trim();
  const whatsapp = business.whatsapp.trim();
  return (
    <div className="floating-contact">
      {phone && (
        <a
          className="floating-call"
          href={`tel:${phone.replace(/[^+\d]/g, "")}`}
          aria-label={`Call L&S: ${phone}`}
        >
          <Phone size={24} />
        </a>
      )}
      {whatsapp && (
        <a
          className="floating-whatsapp"
          href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappGreeting)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Message L&S on WhatsApp (opens in a new tab)"
        >
          <MessageCircle size={24} />
        </a>
      )}
    </div>
  );
}
