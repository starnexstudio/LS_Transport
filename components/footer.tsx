import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
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
        <a href={`mailto:${business.email}`}>
          Kontakt aufnehmen <ArrowUpRight size={19} />
        </a>
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
        Webdesign von <a href="https://starnexstudio.com/">StarNex Studio</a>
      </p>
    </footer>
  );
}
