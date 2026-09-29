import { MessageCircle, Phone } from "lucide-react";
import { business } from "@/lib/content";

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
          aria-label={`L&S anrufen: ${phone}`}
        >
          <Phone size={24} />
        </a>
      )}
      {whatsapp && (
        <a
          className="floating-whatsapp"
          href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Guten Tag L&S, ich möchte ein Vorhaben anfragen.")}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="L&S auf WhatsApp schreiben (öffnet einen neuen Tab)"
        >
          <MessageCircle size={24} />
        </a>
      )}
    </div>
  );
}
