"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { business, whatsappGreeting } from "@/lib/content";

// Always-visible quick contact on every page. While the hero's own call and
// inquiry buttons are on screen it steps aside, so the two never overlap.
export function FloatingContact() {
  const phone = business.phone.trim();
  const whatsapp = business.whatsapp.trim();
  const [hidden, setHidden] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const actions = document.querySelector(".hero-actions");
    if (!actions || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) =>
      setHidden(entry.isIntersecting),
    );
    observer.observe(actions);
    return () => {
      observer.disconnect();
      setHidden(false);
    };
  }, [pathname]);

  return (
    <div className={hidden ? "floating-contact is-hidden" : "floating-contact"}>
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
    </div>
  );
}
