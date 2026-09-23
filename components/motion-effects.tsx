"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const revealSelectors = [
  ".section-top",
  ".service-list",
  ".service-detail",
  ".process-intro",
  ".process-steps li",
  ".photo-example-intro",
  ".moving-photo",
  ".questions > div",
  ".contact-intro",
  ".inquiry",
  ".service-page-heading > div",
  ".service-scope > div",
  ".service-planning > *",
  ".related-services",
  ".service-overview-list > a",
];

export function MotionEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    let observer: IntersectionObserver | undefined;

    function stop() {
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    }

    function start() {
      stop();
      if (preference.matches || !("IntersectionObserver" in window)) return;

      observer = new IntersectionObserver(
        (entries) => {
          let order = 0;
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer?.unobserve(entry.target);
            const animation = entry.target.animate(
              [
                { opacity: 0, transform: "translateY(20px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              {
                duration: 580,
                delay: Math.min(order++ * 60, 120),
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "backwards",
              },
            );
            animations.add(animation);
            animation.onfinish = () => animations.delete(animation);
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
      );

      document
        .querySelectorAll(revealSelectors.join(","))
        .forEach((element) => {
          // Content remains visible without JavaScript; only animate on entry.
          observer?.observe(element);
        });
    }

    function revealFocusedContent(event: FocusEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      animations.forEach((animation) => {
        const element = (animation.effect as KeyframeEffect | null)?.target;
        if (element instanceof Element && element.contains(target)) {
          animation.cancel();
          animations.delete(animation);
        }
      });
    }

    start();
    preference.addEventListener("change", start);
    document.addEventListener("focusin", revealFocusedContent);
    return () => {
      stop();
      preference.removeEventListener("change", start);
      document.removeEventListener("focusin", revealFocusedContent);
    };
  }, [pathname]);

  return null;
}
