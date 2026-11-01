import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, CodeXml, Phone } from "lucide-react";
import { asset } from "@/lib/base-path";
import { business } from "@/lib/content";
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <Link href="/" aria-label="L&S – zur Startseite">
          <Image
            src={asset("/images/ls-logo-440.webp")}
            alt="L&S Entrümpelung & Demontagearbeiten"
            width={440}
            height={280}
          />
        </Link>
        <p>
          Platz schaffen.
          <br />
          <span>Weiterkommen.</span>
        </p>
        <div className="footer-contact">
          {business.phone && (
            <a href={`tel:${business.phone.replace(/[^+\d]/g, "")}`}>
              <Phone size={17} aria-hidden="true" /> {business.phone}
            </a>
          )}
          <a href={`mailto:${business.email}`}>
            Kontakt aufnehmen <ArrowUpRight size={19} aria-hidden="true" />
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {business.name}
        </span>
        <div>
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <a href="#inhalt">Nach oben ↑</a>
        </div>
      </div>
      <p className="footer-credit">
        <a href="https://starnexstudio.com/">
          <CodeXml size={18} strokeWidth={2.5} aria-hidden="true" />
          <span>Website by StarNex Studio</span>
        </a>
      </p>
    </footer>
  );
}
