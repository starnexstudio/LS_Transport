"use client";
import { useEffect, useRef } from "react";
import { stats } from "@/lib/showcase";
import { SampleTag } from "@/components/sample-tag";
import { Stars } from "@/components/stars";

const format = (value: number, decimals = 0) =>
  value.toLocaleString("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

// The key numbers right under the hero. They count up from zero when the band
// scrolls into view, the stars pop in one by one and the dividers grow. Without
// JavaScript or with reduced motion the final values simply stand there.
export function TrustBand() {
  const band = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = band.current;
    if (!root || !("IntersectionObserver" in window)) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const counters = [...root.querySelectorAll<HTMLElement>("[data-count]")];
    let frame = 0;
    const show = (progress: number) =>
      counters.forEach((node) => {
        const value = Number(node.dataset.count);
        const decimals = Number(node.dataset.decimals);
        node.textContent = format(value * progress, decimals);
      });
    // Already on screen (opened further down the page): leave the values be.
    if (root.getBoundingClientRect().top < innerHeight * 0.9) return;
    root.classList.add("is-waiting");
    show(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        root.classList.replace("is-waiting", "is-counted");
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1800);
          show(t === 1 ? 1 : 1 - Math.pow(2, -10 * t)); // ease-out expo
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.45 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      show(1);
    };
  }, []);

  return (
    <section ref={band} className="trust-band" aria-label="L&S in Zahlen">
      <SampleTag className="trust-sample" />
      <ul className="trust-stats">
        {stats.map((stat) => {
          const shown =
            stat.text ??
            `${format(stat.value ?? 0, stat.decimals)}${stat.suffix ?? ""}`;
          return (
            <li key={stat.label}>
              <strong>
                <span className="sr-only">{shown}</span>
                <span aria-hidden="true">
                  {stat.text ?? (
                    <>
                      <span
                        data-count={stat.value}
                        data-decimals={stat.decimals ?? 0}
                      >
                        {format(stat.value ?? 0, stat.decimals)}
                      </span>
                      {stat.suffix && <em>{stat.suffix}</em>}
                    </>
                  )}
                </span>
              </strong>
              {stat.stars && (
                <Stars
                  value={stat.value}
                  size={15}
                  className="trust-stars"
                  decorative
                />
              )}
              <span>{stat.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
