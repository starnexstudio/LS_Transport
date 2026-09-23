"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, ArrowRight } from "lucide-react";
import { services } from "@/lib/content";
import Link from "next/link";
import { serviceDetails } from "@/lib/service-details";
export function Services() {
  const [active, setActive] = useState(0);
  const service = services[active];
  const panel = useRef<HTMLDivElement>(null);
  const previousActive = useRef(active);
  useEffect(() => {
    if (previousActive.current === active) return;
    previousActive.current = active;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches) return;
    const animations = Array.from(panel.current?.children ?? []).map(
      (child, index) =>
        child.animate(
          [
            { opacity: 0, transform: "translateY(8px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 300,
            delay: Math.min(index * 25, 100),
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "backwards",
          },
        ),
    );
    const stop = () => animations.forEach((animation) => animation.cancel());
    preference.addEventListener("change", stop);
    return () => {
      stop();
      preference.removeEventListener("change", stop);
    };
  }, [active]);
  return (
    <div className="services-layout">
      <div
        className="service-list"
        role="tablist"
        aria-label="Unsere Leistungen"
        aria-orientation="vertical"
      >
        {services.map((s, i) => (
          <button
            id={`service-tab-${i}`}
            key={s.title}
            role="tab"
            aria-selected={active === i}
            aria-controls="service-panel"
            tabIndex={active === i ? 0 : -1}
            onKeyDown={(e) => {
              if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const n =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? 4
                      : (active + (e.key === "ArrowDown" ? 1 : 4)) % 5;
                setActive(n);
                document.getElementById(`service-tab-${n}`)?.focus();
              }
            }}
            onClick={() => setActive(i)}
          >
            <span className="service-number">0{i + 1}</span>
            <span>{s.title}</span>
            <ArrowUpRight size={21} />
          </button>
        ))}
      </div>
      <div
        id="service-panel"
        ref={panel}
        className="service-detail"
        role="tabpanel"
        aria-labelledby={`service-tab-${active}`}
        tabIndex={0}
      >
        <span className="eyebrow">L&S / LEISTUNG 0{active + 1}</span>
        <h3>{service.short}</h3>
        <p>{service.text}</p>
        <ul>
          {service.items.map((item) => (
            <li key={item}>
              <Check size={16} />
              {item}
            </li>
          ))}
        </ul>
        <Link
          className="service-detail-link"
          href={`/services/${serviceDetails[active].slug}`}
        >
          Leistungsumfang & Details <ArrowUpRight size={17} />
        </Link>
        <a
          className="text-link"
          href={`#anfrage`}
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("service-select", { detail: service.title }),
            )
          }
        >
          {service.title.includes(" & ") ? "Diese Leistung" : service.title}{" "}
          anfragen <ArrowRight size={18} />
        </a>
      </div>
    </div>
  );
}
