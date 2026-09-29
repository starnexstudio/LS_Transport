import Image from "next/image";
import { asset } from "@/lib/base-path";
export function PhotoExample() {
  return (
    <section className="section photo-example" id="transportvorbereitung">
      <div className="photo-example-intro">
        <div>
          <span className="eyebrow">MÖBELTRANSPORT & LIEFERUNG</span>
          <h2>
            Alles gepackt.
            <br />
            Bereit für den nächsten Schritt.
          </h2>
        </div>
        <p>Sicher verpackt, geschützt transportiert, pünktlich geliefert.</p>
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
      </figure>
    </section>
  );
}
