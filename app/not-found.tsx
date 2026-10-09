import Link from "next/link";
export default function NotFound() {
  return (
    <main className="legal">
      <span className="eyebrow">L&S / PAGE NOT FOUND</span>
      <h1>Plenty of room here.</h1>
      <p>
        The page you are looking for doesn&apos;t exist. Our home page has all
        our services and ways to get in touch.
      </p>
      <Link className="button button-dark" href="/">
        Back to home ↗
      </Link>
    </main>
  );
}
