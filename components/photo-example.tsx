import Image from "next/image";
import { asset } from "@/lib/base-path";
export function PhotoExample() {
  return (
    <section className="section photo-example" id="transportvorbereitung">
      <div className="photo-example-intro">
        <div>
          <span className="eyebrow">MÖBEL & TRANSPORT / GUT VORBEREITET</span>
          <h2>
            Alles gepackt.
            <br />
            Bereit für den nächsten Schritt.
          </h2>
        </div>
        <p>
          Umzugskartons, geschützte Möbel und ein neuer Standort: Wir stimmen
          Abholung, Transport und die gewünschte Montage mit Ihnen ab.
        </p>
      </div>
      <figure>
        <div className="moving-photo-grid">
          <div className="moving-photo">
            <Image
              src={asset("/images/packed-moving-boxes.jpg")}
              alt="Heller Wohnraum mit verschlossenen Umzugskartons, Koffer und abgedecktem Sessel"
              fill
              sizes="(max-width: 760px) 86vw, 43vw"
            />
            <span>Gepackte Umzugskartons</span>
          </div>
          <div className="moving-photo">
            <Image
              src={asset("/images/wrapped-living-room.jpg")}
              alt="Wohnzimmer mit Sofa und Sesseln, die mit Schutzfolie abgedeckt sind"
              fill
              sizes="(max-width: 760px) 86vw, 43vw"
            />
            <span>Geschützte Möbel</span>
          </div>
        </div>
        <figcaption>
          Symbolfotos:{" "}
          <a
            href="https://www.pexels.com/photo/empty-apartment-with-packed-carton-boxes-before-moving-4246119/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ketut Subiyanto
          </a>{" "}
          und{" "}
          <a
            href="https://www.pexels.com/photo/furniture-covered-with-plastics-7415019/"
            target="_blank"
            rel="noopener noreferrer"
          >
            MART PRODUCTION
          </a>{" "}
          / Pexels ·{" "}
          <a
            href="https://www.pexels.com/license/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bildlizenz
          </a>
          . Die Fotos zeigen keinen Auftrag von L&S.
        </figcaption>
      </figure>
    </section>
  );
}
