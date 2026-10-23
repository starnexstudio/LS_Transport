import { ArrowRight } from "lucide-react";
import { pairs as photoPairs } from "@/lib/gallery";
import { CompareSlider } from "@/components/compare-slider";

// Supplied before/after pairs.
const pairRows = [
  {
    pair: photoPairs.clearance,
    label: "Entrümpelung",
    title: "Von vollgestellt zu geräumt",
  },
  {
    pair: photoPairs.bathroom,
    label: "Demontage",
    title: "Fliesen und Armaturen entfernt",
  },
];

export function BeforeAfter() {
  return (
    <section className="section before-after" id="vorher-nachher">
      <div className="section-top">
        <div>
          <span className="eyebrow">VORHER & NACHHER</span>
          <h2>
            Räumungsbeginn
            <br />
            Räumungsabschluss
          </h2>
        </div>
        <p>Ziehen Sie den Regler, um den Unterschied zu sehen.</p>
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
          Unverbindlich anfragen <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}
