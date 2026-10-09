"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronsLeftRight } from "lucide-react";
import { asset } from "@/lib/base-path";
import { pairs as photoPairs } from "@/lib/gallery";
import { MediaRow } from "@/components/media-row";

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

// Supplied before/after pairs, each linked to its service page.
const pairRows = [
  {
    pair: photoPairs.clearance,
    label: "Clearance",
    title: "From cluttered to cleared",
    href: "/services/clearance",
  },
  {
    pair: photoPairs.bedroom,
    label: "Furniture removal",
    title: "Furniture out, room empty",
    href: "/services/furniture-transport",
  },
  {
    pair: photoPairs.bathroom,
    label: "Dismantling",
    title: "Tiles and fittings removed",
    href: "/services/dismantling",
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
        Before
      </span>
      <span
        className={`compare-tag compare-tag-after${hideAfter ? " is-hidden" : ""}`}
        aria-hidden="true"
      >
        After
      </span>
      <span className="compare-divider" aria-hidden="true">
        <span className="compare-handle">
          <ChevronsLeftRight size={22} />
        </span>
      </span>
      <span className="compare-hint" aria-hidden="true">
        Drag to compare
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={position}
        aria-label={`Before-and-after comparison, ${pair.label}: move the slider left or right`}
        aria-valuetext={`${position}% of the before photo visible`}
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
          <span className="eyebrow">BEFORE & AFTER</span>
          <h2>
            Packed full.
            <br />
            Cleared out.
          </h2>
        </div>
        <p>See the difference, room by room.</p>
      </div>
      <div className="pair-rows">
        {pairRows.map(({ pair, label, title, href }) => (
          <div key={label} className="pair-row">
            <MediaRow items={[{ pair }]} />
            <div className="pair-row-text">
              <span className="eyebrow">{label.toUpperCase()}</span>
              <h3>{title}</h3>
              <Link className="text-link" href={href}>
                About this service <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        ))}
      </div>
      <h3 className="slider-heading">Drag to compare</h3>
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
