import type { CSSProperties } from "react";

const path =
  "M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z";

// Five rating stars; `value` fills them (whole stars). Each star carries --i for
// staggered animations.
export function Stars({
  value = 5,
  size = 16,
  className = "",
  decorative = false,
}: {
  value?: number;
  size?: number;
  className?: string;
  /** The rating is already said in text next to it. */
  decorative?: boolean;
}) {
  return (
    <span
      className={`stars ${className}`}
      {...(decorative
        ? { "aria-hidden": true }
        : {
            role: "img",
            "aria-label": `${value.toLocaleString("de-DE")} von 5 Sternen`,
          })}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          className={i < Math.round(value) ? "star is-on" : "star"}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{ "--i": i } as CSSProperties}
        >
          <path d={path} />
        </svg>
      ))}
    </span>
  );
}
