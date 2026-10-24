"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronsLeftRight } from "lucide-react";
import { asset } from "@/lib/base-path";

export type SliderPair = {
  label: string;
  before: { src: string; alt: string };
  after: { src: string; alt: string };
};

// Room each corner label needs (label width plus its inset), in pixels.
const TAG_SPACE = 104;

// A before/after comparison in a fixed frame (its proportions come from the CSS);
// both photos cover it. The divider follows a native range input laid over the
// photos: drag anywhere, arrow keys, screen readers.
export function CompareSlider({ pair }: { pair: SliderPair }) {
  const [position, setPosition] = useState(50);
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
  const sizes = "(max-width: 760px) 92vw, 500px";
  return (
    <div
      ref={frame}
      className="compare"
      style={{ "--position": `${position}%` } as React.CSSProperties}
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
      <span className="compare-shade" aria-hidden="true" />
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
          <ChevronsLeftRight size={20} strokeWidth={2} />
        </span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={position}
        aria-label={`Vorher-Nachher-Vergleich, ${pair.label}: Regler nach links oder rechts bewegen`}
        aria-valuetext={`${position} % des Vorher-Fotos sichtbar`}
        onChange={(event) => setPosition(Number(event.target.value))}
      />
    </div>
  );
}
