import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Privacy notice | L&S",
  robots: { index: false, follow: false },
};
export default function Privacy() {
  return (
    <main id="inhalt" className="legal">
      <Link href="/">← Back to home</Link>
      <h1>Privacy notice</h1>
      <div className="legal-note">
        Provisional notice for the local website. Before publication, the
        details of the data controller and the actual hosting must be completed
        and the privacy policy reviewed.
      </div>
      <h2>Contact</h2>
      <p>
        L&S Entrümpelung & Demontagearbeiten
        <br />
        <a href="mailto:Info@entruempelung-demontage.de">
          Info@entruempelung-demontage.de
        </a>
      </p>
      <h2>Requests by email</h2>
      <p>
        The request form only prepares an email text in your browser. It does
        not send any form data to a server and does not store it permanently.
        Your details are only transmitted via your email provider once you send
        the draft yourself from your email app. At your request, the copy
        function places the request text on your clipboard.
      </p>
      <h2>Technical setup</h2>
      <p>
        The website does not use analytics tools, advertising trackers or
        embedded maps. Images and fonts are delivered locally with the website.
        The website does not set any cookies.
      </p>
      <h2>Before publication</h2>
      <p>
        The final notice must cover in particular the full data controller,
        hosting and log data, the handling of incoming emails, and the related
        legal bases, retention periods and data subject rights. The company and
        hosting details required for this are not yet available.
      </p>
    </main>
  );
}
