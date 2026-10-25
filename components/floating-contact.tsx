"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { business, whatsappGreeting } from "@/lib/content";

// Quick contact on every page. It steps aside wherever the page shows its own
// contact buttons (the hero, the inquiry section) and over the footer, so it
// never covers the form, its buttons or the footer links.
export function FloatingContact() {
  const phone = business.phone.trim();
  const whatsapp = business.whatsapp.trim();
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        if (isIntersecting) onScreen.add(target);
        else onScreen.delete(target);
      }
      setHidden(onScreen.size > 0);
    });
    document
      .querySelectorAll(".hero-actions, #anfrage, .footer")
      .forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      setHidden(false);
    };
  }, [pathname]);

  return (
    <aside
      className={hidden ? "floating-contact is-hidden" : "floating-contact"}
      aria-label="Schnellkontakt"
    >
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
          href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappGreeting)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="L&S per WhatsApp schreiben (öffnet in neuem Tab)"
        >
          <MessageCircle size={24} />
        </a>
      )}
    </aside>
  );
}
