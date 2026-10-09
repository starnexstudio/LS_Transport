import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { business, whatsappGreeting } from "@/lib/content";

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
            Available <strong>24 hours</strong>
          </span>
        </li>
        <li className="topbar-region">
          <MapPin size={15} aria-hidden="true" />
          <span>
            <strong>Across Germany</strong> by arrangement
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
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappGreeting)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp (opens in a new tab)"
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
