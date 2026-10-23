import Image from "next/image";
import { asset } from "@/lib/base-path";

// Illustrative photos, not L&S jobs: six generated in Figma (file
// BpwhS8xqHLkMte8zwimTER, Page 1) and two licensed Pexels photos; see ASSET_NOTES.md.
const tiles = [
  {
    src: "/images/showcase/loading-van.webp",
    area: "van",
    label: "Beladen und sichern",
    alt: "Zwei Umzugshelfer beladen einen weißen Lkw mit Hebebühne vor einem Wohnhaus",
  },
  {
    src: "/images/showcase/empty-room.webp",
    area: "room",
    label: "Besenrein übergeben",
    alt: "Leeres, helles Zimmer mit Fischgrätparkett und Morgensonne",
  },
  {
    src: "/images/showcase/sorting.webp",
    area: "sort",
    label: "Sortiert und entsorgt",
    alt: "Mitarbeiter sortiert Holz, Metall, Elektroteile und Karton in getrennte Kisten",
  },
  {
    src: "/images/showcase/hallway.webp",
    area: "hall",
    label: "Bereit zum Abtransport",
    alt: "Flur mit gestapelten Umzugskartons, eingepackten Möbeln und einer Sackkarre",
  },
  {
    src: "/images/showcase/stairwell.webp",
    area: "stair",
    label: "Sicher durchs Treppenhaus",
    alt: "Zwei Helfer tragen ein in Decken gehülltes Sofa mit Tragegurten die Treppe hinunter",
  },
  {
    src: "/images/showcase/dismantling.webp",
    area: "dism",
    label: "Fachgerecht demontiert",
    alt: "Handwerker demontiert einen Holzschrank mit dem Akkuschrauber",
  },
  {
    src: "/images/wrapped-living-room.jpg",
    area: "wrap",
    label: "Möbel geschützt",
    alt: "Wohnzimmer mit Sofa und Sesseln unter Schutzfolie",
  },
  {
    src: "/images/packed-moving-boxes.jpg",
    area: "pack",
    label: "Sorgfältig verpackt",
    alt: "Helles Wohnzimmer mit verschlossenen Umzugskartons, einem Koffer und einem abgedeckten Sessel",
  },
];

const big = new Set(["van", "stair"]);

// "Im Einsatz": a bento grid of photos. Where the browser supports scroll-driven
// animations, each tile unveils as it scrolls in and its photo drifts slowly
// against the scroll (app/showcase.css); hovering zooms the photo a touch.
export function Gallery() {
  return (
    <section
      className="section gallery"
      id="im-einsatz"
      aria-labelledby="gallery-title"
    >
      <div className="section-top">
        <div>
          <span className="eyebrow">IM EINSATZ</span>
          <h2 id="gallery-title">
            Sorgfalt,
            <br />
            die man sieht.
          </h2>
        </div>
        <p>
          Wir verpacken, tragen, demontieren und entsorgen – und übergeben
          besenrein.
          <small>Symbolbilder</small>
        </p>
      </div>
      <div className="gallery-grid">
        {tiles.map(({ src, area, label, alt }, i) => (
          <figure key={area} className="gallery-tile" style={{ gridArea: area }}>
            <div className="gallery-media">
              <Image
                src={asset(src)}
                alt={alt}
                fill
                sizes={
                  big.has(area)
                    ? "(max-width: 1023px) 92vw, 46vw"
                    : "(max-width: 1023px) 46vw, 23vw"
                }
              />
            </div>
            <figcaption>
              <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              {label}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
