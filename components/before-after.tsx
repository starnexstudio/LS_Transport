import { ArrowRight } from "lucide-react";
import { pairs as photoPairs } from "@/lib/gallery";
import { CompareSlider } from "@/components/compare-slider";

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
      <div className="before-after-footer">
        <a href="#anfrage" className="button button-orange before-after-cta">
          Request a quote <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}
