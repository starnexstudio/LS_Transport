import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { business } from "@/lib/content";

// Slim utility bar above the header: availability left, direct contact right.
export function TopBar() {
  const phone = business.phone.trim();
  const whatsapp = business.whatsapp.trim();
  return (
    <div className="topbar">
      <ul className="topbar-info">
        <li>
          <span className="topbar-live" aria-hidden="true" />
          <span>
            <strong>24 h</strong> erreichbar
          </span>
        </li>
        <li className="topbar-region">
          <MapPin size={15} aria-hidden="true" />
          <span>
            <strong>Deutschlandweit</strong> nach Absprache
          </span>
        </li>
      </ul>
      <ul className="topbar-contact">
        {phone && (
          <li>
            <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>
              <Phone size={15} aria-hidden="true" />
              <span>{phone}</span>
            </a>
          </li>
        )}
        {whatsapp && (
          <li className="topbar-whatsapp">
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Guten Tag L&S, ich möchte ein Vorhaben anfragen.")}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp (öffnet einen neuen Tab)"
            >
              <MessageCircle size={15} aria-hidden="true" />
              <span>WhatsApp</span>
            </a>
          </li>
        )}
        <li className="topbar-mail">
          <a href={`mailto:${business.email}`}>
            <Mail size={15} aria-hidden="true" />
            <span>{business.email}</span>
          </a>
        </li>
      </ul>
    </div>
  );
}
