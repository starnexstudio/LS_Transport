"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { ContactActions } from "@/components/contact-actions";
import { asset } from "@/lib/base-path";
export function Header() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
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
          src={asset("/images/ls-logo.png")}
          alt="L&S Entrümpelung & Demontagearbeiten"
          width={112}
          height={74}
          priority
        />
        <span>
          ENTRÜMPELUNG &<br />
          DEMONTAGEARBEITEN
        </span>
      </Link>
      <nav
        id="main-navigation"
        className={open ? "navigation is-open" : "navigation"}
        aria-label="Hauptnavigation"
      >
        <Link href="/#leistungen" onClick={() => setOpen(false)}>
          Leistungen
        </Link>
        <Link href="/#ablauf" onClick={() => setOpen(false)}>
          So läuft’s
        </Link>
        <Link href="/#fragen" onClick={() => setOpen(false)}>
          Häufige Fragen
        </Link>
        <Link
          href="/#anfrage"
          className="header-cta"
          onClick={() => setOpen(false)}
        >
          Projekt anfragen <ArrowUpRight size={17} />
        </Link>
      </nav>
      <ContactActions compact />
      <button
        ref={menuButton}
        className="menu-toggle"
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        aria-expanded={open}
        aria-controls="main-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}
