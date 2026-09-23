import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { ContactActions } from "@/components/contact-actions";
import { asset } from "@/lib/base-path";
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <Link href="/" aria-label="L&S Startseite">
          <Image
            src={asset("/images/ls-logo.png")}
            alt="L&S Entrümpelung & Demontagearbeiten"
            width={140}
            height={93}
          />
        </Link>
        <p>
          Platz schaffen.
          <br />
          <span>Weiterkommen.</span>
        </p>
        <a href="mailto:Info@entruempelung-demontage.de">
          Lassen Sie uns sprechen <ArrowUpRight size={19} />
        </a>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} L&S Entrümpelung & Demontagearbeiten
        </span>
        <div>
          <Link href="/services">Alle Leistungen</Link>
          <Link href="/legal-notice">Impressum</Link>
          <Link href="/privacy">Datenschutz</Link>
          <a href="#inhalt">Nach oben ↑</a>
        </div>
      </div>
      <ContactActions compact />
    </footer>
  );
}
