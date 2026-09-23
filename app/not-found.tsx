import Link from "next/link";
export default function NotFound() {
  return (
    <main className="legal">
      <span className="eyebrow">L&S / SEITE NICHT GEFUNDEN</span>
      <h1>Hier ist noch Platz.</h1>
      <p>
        Die gewünschte Seite gibt es nicht. Auf unserer Startseite finden Sie
        unsere Leistungen und Kontaktmöglichkeiten.
      </p>
      <Link className="button button-dark" href="/">
        Zur Startseite ↗
      </Link>
    </main>
  );
}
