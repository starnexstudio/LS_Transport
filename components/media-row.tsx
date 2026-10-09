import Image from "next/image";
import { asset } from "@/lib/base-path";
import type { Pair, Photo } from "@/lib/gallery";
import { CompareSlider } from "@/components/compare-slider";

// A before/after pair (shown as a drag-to-reveal slider) or a single photo.
export type MediaItem = { pair: Pair; label: string } | { photo: Photo };

// Tallest a row may get on wide screens; narrower rows shrink to keep this height.
const MAX_HEIGHT = 600;
const GAP = 12;

const ratio = (photo: Photo) => photo.width / photo.height;

/**
 * Photos and sliders side by side at one shared height, each in its own
 * proportions (column widths follow the aspect ratios). Stacks on mobile.
 */
export function MediaRow({ items }: { items: MediaItem[] }) {
  const ratios = items.map((item) =>
    ratio("pair" in item ? item.pair.before : item.photo),
  );
  const total = ratios.reduce((sum, value) => sum + value, 0);
  const maxWidth = Math.round(total * MAX_HEIGHT + GAP * (items.length - 1));
  return (
    <div
      className="media-row"
      style={
        {
          // Normalised so the fractions always add up to the full row width.
          "--columns": ratios
            .map((value) => `minmax(0, ${value / total}fr)`)
            .join(" "),
          "--max-width": `${maxWidth}px`,
        } as React.CSSProperties
      }
    >
      {items.map((item) =>
        "pair" in item ? (
          <CompareSlider
            key={item.pair.before.src}
            pair={{
              label: item.label,
              width: item.pair.before.width,
              height: item.pair.before.height,
              before: item.pair.before,
              after: item.pair.after,
            }}
          />
        ) : (
          <figure
            key={item.photo.src}
            className="media-photo"
            style={{
              aspectRatio: `${item.photo.width} / ${item.photo.height}`,
            }}
          >
            <Image
              src={asset(item.photo.src)}
              alt={item.photo.alt}
              fill
              sizes="(max-width: 760px) 90vw, 40vw"
            />
            {item.photo.caption && (
              <figcaption className="media-caption">
                {item.photo.caption}
              </figcaption>
            )}
          </figure>
        ),
      )}
    </div>
  );
}
