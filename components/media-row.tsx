import Image from "next/image";
import { asset } from "@/lib/base-path";
import type { Pair, Photo } from "@/lib/gallery";

export type MediaItem = { pair: Pair } | { photo: Photo };

// Tallest a row may get on wide screens; narrower rows shrink to keep this height.
const MAX_HEIGHT = 500;
const GAP = 12;

type Cell = { photo: Photo; label?: "Before" | "After" };

function cells(items: MediaItem[]): Cell[] {
  return items.flatMap((item) =>
    "pair" in item
      ? [
          { photo: item.pair.before, label: "Before" as const },
          { photo: item.pair.after, label: "After" as const },
        ]
      : [{ photo: item.photo }],
  );
}

/**
 * Photos side by side at one shared height, each in its own proportions
 * (column widths follow the aspect ratios). Stacks on mobile; before/after
 * pairs are labelled and stay next to each other.
 */
export function MediaRow({ items }: { items: MediaItem[] }) {
  const list = cells(items);
  const ratios = list.map(({ photo }) => photo.width / photo.height);
  const total = ratios.reduce((sum, ratio) => sum + ratio, 0);
  const maxWidth = Math.round(total * MAX_HEIGHT + GAP * (list.length - 1));
  return (
    <div
      className="media-row"
      style={
        {
          "--columns": ratios.map((ratio) => `minmax(0, ${ratio}fr)`).join(" "),
          "--max-width": `${maxWidth}px`,
        } as React.CSSProperties
      }
    >
      {list.map(({ photo, label }) => (
        <figure
          key={photo.src}
          className="media-photo"
          style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
        >
          <Image
            src={asset(photo.src)}
            alt={photo.alt}
            fill
            sizes="(max-width: 760px) 90vw, 40vw"
          />
          {label ? (
            <figcaption
              className={`compare-tag compare-tag-${label.toLowerCase()}`}
            >
              {label}
            </figcaption>
          ) : (
            photo.caption && (
              <figcaption className="media-caption">{photo.caption}</figcaption>
            )
          )}
        </figure>
      ))}
    </div>
  );
}
