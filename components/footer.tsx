import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { ContactActions } from "@/components/contact-actions";
import { asset } from "@/lib/base-path";
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <Link href="/" aria-label="L&S home">
          <Image
            src={asset("/images/ls-logo.webp")}
            alt="L&S Entrümpelung & Demontagearbeiten"
            width={520}
            height={328}
          />
        </Link>
        <p>
          Make space.
          <br />
          <span>Move forward.</span>
        </p>
        <a href="mailto:Info@entruempelung-demontage.de">
          Let&apos;s talk <ArrowUpRight size={19} />
        </a>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} L&S Entrümpelung & Demontagearbeiten
        </span>
        <div>
          <Link href="/legal-notice">Legal notice</Link>
          <Link href="/privacy">Privacy</Link>
          <a href="#inhalt">Back to top ↑</a>
        </div>
      </div>
      <ContactActions compact />
    </footer>
  );
}
