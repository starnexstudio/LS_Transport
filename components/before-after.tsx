"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, ChevronsLeftRight } from "lucide-react";
import { pairs as photoPairs } from "@/lib/gallery";
import { CompareSlider } from "@/components/compare-slider";

// Supplied before/after pairs.
const projects = [
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
const number = (i: number) => String(i + 1).padStart(2, "0");

// Vorher & Nachher (Figma: file BpwhS8xqHLkMte8zwimTER, page "Vorher & Nachher –
// v2"): one compact comparison and the projects to switch between, as a list
// beside it on wide screens and a segmented switch above it on phones.
export function BeforeAfter() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const project = projects[active];
  // Tabs pattern: the arrow keys move between the projects.
  function onKey(event: KeyboardEvent) {
    const steps: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (active + step + projects.length) % projects.length;
    setActive(next);
    tabs.current[next]?.focus();
  }
  return (
    <section className="section before-after" id="vorher-nachher">
      <div className="ba-intro">
        <span className="eyebrow ba-eyebrow">VORHER & NACHHER</span>
        <h2>
          Räumungsbeginn.
          <br />
          <span>Räumungsabschluss.</span>
        </h2>
        <p>
          Echte Räume, echte Ergebnisse: vom ersten Karton bis zur besenreinen
          Übergabe.
        </p>
        <div
          className="ba-tabs"
          role="tablist"
          aria-label="Projekte"
          onKeyDown={onKey}
        >
          {projects.map(({ label, title }, i) => (
            <button
              key={label}
              ref={(node) => {
                tabs.current[i] = node;
              }}
              type="button"
              role="tab"
              id={`ba-tab-${i}`}
              aria-selected={i === active}
              aria-controls="ba-panel"
              tabIndex={i === active ? 0 : -1}
              className="ba-tab"
              onClick={() => setActive(i)}
            >
              <span className="ba-tab-number" aria-hidden="true">
                {number(i)}
              </span>
              <span className="ba-tab-text">
                <strong>{label}</strong>
                <span>{title}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <figure
        className="ba-stage"
        id="ba-panel"
        role="tabpanel"
        aria-labelledby={`ba-tab-${active}`}
      >
        <CompareSlider
          key={project.label}
          pair={{
            label: project.label,
            before: project.pair.before,
            after: project.pair.after,
          }}
        />
        <figcaption className="ba-meta">
          <span className="ba-meta-project">
            <strong>{project.label}</strong>
            {project.title}
          </span>
          <span className="ba-count">
            {number(active)} / {number(projects.length - 1)}
          </span>
          <span className="ba-hint" aria-hidden="true">
            <ChevronsLeftRight size={16} />
            Regler ziehen zum Vergleichen
          </span>
        </figcaption>
      </figure>
      <a href="#anfrage" className="button button-orange ba-cta">
        Unverbindlich anfragen <ArrowRight size={18} />
      </a>
    </section>
  );
}
