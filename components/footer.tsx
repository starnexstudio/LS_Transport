import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { asset } from "@/lib/base-path";
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <Link href="/" aria-label="L&S – zur Startseite">
          <Image
            src={asset("/images/ls-logo.webp")}
            alt="L&S Entrümpelung & Demontagearbeiten"
            width={897}
            height={570}
          />
        </Link>
        <p>
          Platz schaffen.
          <br />
          <span>Weiterkommen.</span>
        </p>
        <a href="mailto:Info@entruempelung-demontage.de">
          Kontakt aufnehmen <ArrowUpRight size={19} />
        </a>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} L&S Entrümpelung & Demontagearbeiten
        </span>
        <div>
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <a href="#inhalt">Nach oben ↑</a>
        </div>
      </div>
    </footer>
  );
}
