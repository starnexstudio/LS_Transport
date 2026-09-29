"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ChevronsLeftRight,
  PackageCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { asset } from "@/lib/base-path";

type Pair = {
  id: string;
  label: string;
  title: string;
  // Pixel size shared by both photos; sets the frame's proportions.
  width: number;
  height: number;
  before: { src: string; alt: string };
  after: { src: string; alt: string };
};

// Both photos of a pair must show the same room from the same spot, at the
// same size, so the slider seam lines up.
const pairs: Pair[] = [
  {
    id: "schlafzimmer",
    label: "Schlafzimmer",
    title: "Kartons verladen, Raum frei",
    width: 1600,
    height: 900,
    before: {
      src: "/images/vorher.jpg",
      alt: "Schlafzimmer voller gestapelter Umzugskartons vor dem Abtransport",
    },
    after: {
      src: "/images/nachher.jpg",
      alt: "Dasselbe Schlafzimmer nach dem Abtransport der Umzugskartons",
    },
  },
  {
    id: "wohnbereich",
    label: "Wohn- & Essbereich",
    title: "Kartons raus, Wohnraum zurück",
    width: 750,
    height: 1000,
    before: {
      src: "/images/vorher-2.jpg",
      alt: "Wohn- und Essbereich voller Umzugs- und Versandkartons",
    },
    after: {
      src: "/images/nachher-2.jpg",
      alt: "Derselbe Wohn- und Essbereich ohne Kartons, der Boden ist wieder frei",
    },
  },
];

const highlights = [
  {
    Icon: PackageCheck,
    title: "Geschützt verpackt",
    text: "Möbel sicher für den Transport vorbereitet",
  },
  {
    Icon: Truck,
    title: "Abgebaut & abtransportiert",
    text: "Transport, Lieferung oder Entsorgung",
  },
  {
    Icon: Sparkles,
    title: "Besenrein übergeben",
    text: "Auf Wunsch mit Reinigung im Anschluss",
  },
];

// Room each corner label needs (label width plus its inset), in pixels.
const TAG_SPACE = 130;

function CompareSlider({ pair }: { pair: Pair }) {
  const [position, setPosition] = useState(50);
  const [touched, setTouched] = useState(false);
  const [width, setWidth] = useState(0);
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  // Hide a label once its side is too narrow to hold it, so it never sits
  // on the wrong photo or under the divider.
  const divider = (position / 100) * width;
  const hideBefore = width > 0 && divider < TAG_SPACE;
  const hideAfter = width > 0 && width - divider < TAG_SPACE;
  const sizes = "(max-width: 960px) 90vw, 60vw";
  return (
    <div
      ref={frame}
      className={touched ? "compare is-touched" : "compare"}
      style={
        {
          "--position": `${position}%`,
          aspectRatio: `${pair.width} / ${pair.height}`,
        } as React.CSSProperties
      }
    >
      <Image
        src={asset(pair.after.src)}
        alt={pair.after.alt}
        fill
        sizes={sizes}
      />
      <div className="compare-before">
        <Image
          src={asset(pair.before.src)}
          alt={pair.before.alt}
          fill
          sizes={sizes}
        />
      </div>
      <span
        className={`compare-tag compare-tag-before${hideBefore ? " is-hidden" : ""}`}
        aria-hidden="true"
      >
        Vorher
      </span>
      <span
        className={`compare-tag compare-tag-after${hideAfter ? " is-hidden" : ""}`}
        aria-hidden="true"
      >
        Nachher
      </span>
      <span className="compare-divider" aria-hidden="true">
        <span className="compare-handle">
          <ChevronsLeftRight size={22} />
        </span>
      </span>
      <span className="compare-hint" aria-hidden="true">
        Ziehen zum Vergleichen
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={position}
        aria-label={`Vorher-Nachher-Vergleich ${pair.label}: Regler nach links oder rechts bewegen`}
        aria-valuetext={`${position} % Vorher sichtbar`}
        onChange={(event) => {
          setPosition(Number(event.target.value));
          setTouched(true);
        }}
      />
    </div>
  );
}

export function BeforeAfter() {
  return (
    <section className="section before-after" id="vorher-nachher">
      <div className="section-top">
        <div>
          <span className="eyebrow">VORHER & NACHHER</span>
          <h2>
            Voll gestellt.
            <br />
            Frei geräumt.
          </h2>
        </div>
        <p>Ziehen Sie den Regler und sehen Sie den Unterschied.</p>
      </div>
      {/* Column widths follow each photo's proportions, so all frames share one height. */}
      <div
        className="before-after-gallery"
        style={
          {
            "--columns": pairs
              .map((pair) => `minmax(0, ${pair.width / pair.height}fr)`)
              .join(" "),
          } as React.CSSProperties
        }
      >
        {pairs.map((pair) => (
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
        <ul>
          {highlights.map(({ Icon, title, text }) => (
            <li key={title}>
              <span className="before-after-icon">
                <Icon size={19} />
              </span>
              <span>
                <strong>{title}</strong>
                {text}
              </span>
            </li>
          ))}
        </ul>
        <a href="#anfrage" className="button button-orange before-after-cta">
          Ihr Vorhaben anfragen <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}
