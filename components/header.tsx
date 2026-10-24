"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, X } from "lucide-react";
import { asset } from "@/lib/base-path";
import { business } from "@/lib/content";

const links = [
  ["/#leistungen", "Leistungen"],
  ["/#ablauf", "Ablauf"],
  ["/#fragen", "Fragen"],
];

export function Header() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const phone = business.phone.trim();
  return (
    <header
      className="header"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          menuButton.current?.focus();
        }
      }}
    >
      <Link className="brand" href="/" aria-label="L&S – zur Startseite">
        <Image
          src={asset("/images/ls-logo.webp")}
          alt="L&S Entrümpelung & Demontagearbeiten"
          width={897}
          height={570}
          loading="eager"
          fetchPriority="high"
        />
      </Link>
      <nav
        id="main-navigation"
        className={open ? "navigation is-open" : "navigation"}
        aria-label="Hauptnavigation"
      >
        {links.map(([href, label]) => (
          <Link key={href} href={href} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        {phone && (
          <a
            className="header-call"
            href={`tel:${phone.replace(/[^+\d]/g, "")}`}
            aria-label={`Anrufen: ${phone}`}
          >
            <Phone
              size={16}
              strokeWidth={1.5}
              absoluteStrokeWidth
              aria-hidden="true"
            />
            {phone}
          </a>
        )}
        <button
          ref={menuButton}
          className="menu-toggle"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <X size={22} aria-hidden="true" />
          ) : (
            // Figma's menu glyph (shorter last line) has no lucide equivalent.
            <img
              src={asset("/images/hero-room/icon-menu.svg")}
              alt=""
              width={22}
              height={22}
            />
          )}
        </button>
      </div>
    </header>
  );
}
