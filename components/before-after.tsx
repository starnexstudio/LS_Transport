import { ArrowRight } from "lucide-react";
import { pairs as photoPairs } from "@/lib/gallery";
import { CompareSlider, type SliderPair } from "@/components/compare-slider";

type Pair = SliderPair & { id: string; title: string };

// Both photos of a pair must show the same room from the same spot, at the
// same size, so the slider seam lines up.
const sliderPairs: Pair[] = [
  {
    id: "schlafzimmer",
    label: "Bedroom",
    title: "Boxes loaded, room cleared",
    width: 1600,
    height: 900,
    before: {
      src: "/images/vorher.jpg",
      alt: "Bedroom full of stacked moving boxes before removal",
    },
    after: {
      src: "/images/nachher.jpg",
      alt: "The same bedroom after the moving boxes were removed",
    },
  },
  {
    id: "wohnbereich",
    label: "Living & dining area",
    title: "Boxes out, living space back",
    width: 750,
    height: 1000,
    before: {
      src: "/images/vorher-2.jpg",
      alt: "Living and dining area full of moving and shipping boxes",
    },
    after: {
      src: "/images/nachher-2.jpg",
      alt: "The same living and dining area without the boxes, the floor clear again",
    },
  },
];

// Supplied before/after pairs.
const pairRows = [
  {
    pair: photoPairs.clearance,
    label: "Clearance",
    title: "From cluttered to cleared",
  },
  {
    pair: photoPairs.bedroom,
    label: "Furniture removal",
    title: "Furniture out, room empty",
  },
  {
    pair: photoPairs.bathroom,
    label: "Dismantling",
    title: "Tiles and fittings removed",
  },
];

export function BeforeAfter() {
  return (
    <section className="section before-after" id="vorher-nachher">
      <div className="section-top">
        <div>
          <span className="eyebrow">BEFORE & AFTER</span>
          <h2>
            Packed full.
            <br />
            Cleared out.
          </h2>
        </div>
        <p>Drag the slider to see the difference.</p>
      </div>
      {/* Column widths follow each photo's proportions, so all sliders share one height. */}
      <div
        className="before-after-gallery"
        style={
          {
            "--columns": pairRows
              .map(
                ({ pair }) =>
                  `minmax(0, ${pair.before.width / pair.before.height}fr)`,
              )
              .join(" "),
          } as React.CSSProperties
        }
      >
        {pairRows.map(({ pair, label, title }) => (
          <figure key={label} className="before-after-item is-portrait">
            <CompareSlider
              pair={{
                label,
                width: pair.before.width,
                height: pair.before.height,
                before: pair.before,
                after: pair.after,
              }}
            />
            <figcaption>
              <strong>{label}</strong>
              {title}
            </figcaption>
          </figure>
        ))}
      </div>
      <h3 className="slider-heading">More examples</h3>
      {/* Column widths follow each photo's proportions, so all frames share one height. */}
      <div
        className="before-after-gallery"
        style={
          {
            "--columns": sliderPairs
              .map((pair) => `minmax(0, ${pair.width / pair.height}fr)`)
              .join(" "),
          } as React.CSSProperties
        }
      >
        {sliderPairs.map((pair) => (
          <figure
            key={pair.id}
            className={
              pair.height > pair.width
                ? "before-after-item is-portrait"
                : "before-after-item"
            }
          >
            <CompareSlider pair={pair} />
            <figcaption>
              <strong>{pair.label}</strong>
              {pair.title}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="before-after-footer">
        <a href="#anfrage" className="button button-orange before-after-cta">
          Request a quote <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}
