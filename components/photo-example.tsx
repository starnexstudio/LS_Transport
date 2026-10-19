import Image from "next/image";
import { asset } from "@/lib/base-path";
export function PhotoExample() {
  return (
    <section className="section photo-example" id="transportvorbereitung">
      <div className="photo-example-intro">
        <div>
          <span className="eyebrow">MÖBELTRANSPORT & LIEFERUNG</span>
          <h2>
            Alles verpackt.
            <br />
            Bereit für den nächsten Schritt.
          </h2>
        </div>
        <p>
          Wir verpacken, schützen und sichern Ihre Möbel sorgfältig für einen
          sicheren Transport – von der Abholung bis zur Lieferung.
        </p>
      </div>
      <figure>
        <div className="moving-photo-grid">
          <div className="moving-photo">
            <Image
              src={asset("/images/packed-moving-boxes.jpg")}
              alt="Helles Wohnzimmer mit verschlossenen Umzugskartons, einem Koffer und einem abgedeckten Sessel"
              fill
              sizes="(max-width: 760px) 86vw, 43vw"
            />
            <span>Sorgfältig für den Transport verpackt</span>
          </div>
          <div className="moving-photo">
            <Image
              src={asset("/images/wrapped-living-room.jpg")}
              alt="Wohnzimmer mit Sofa und Sesseln unter Schutzfolie"
              fill
              sizes="(max-width: 760px) 86vw, 43vw"
            />
            <span>Möbel während des ganzen Umzugs geschützt</span>
          </div>
        </div>
      </figure>
    </section>
  );
}
