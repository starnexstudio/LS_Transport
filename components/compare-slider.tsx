"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronsLeftRight } from "lucide-react";
import { asset } from "@/lib/base-path";

export type SliderPair = {
  label: string;
  // Pixel size shared by both photos; sets the frame's proportions.
  width: number;
  height: number;
  before: { src: string; alt: string };
  after: { src: string; alt: string };
};

// Room each corner label needs (label width plus its inset), in pixels.
const TAG_SPACE = 130;

export function CompareSlider({ pair }: { pair: SliderPair }) {
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
