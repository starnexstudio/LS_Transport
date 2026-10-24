"use client";
import { useEffect, useRef, type ReactNode } from "react";

// Length of the clearing timeline in ms (Figma: last piece out at 4.47s).
const timeline = 4600;
// Share of the pinned scroll spent on the clearing, matched to the 3D scene:
// "Neues." is underlined as the room empties; the rest of the scroll shuts
// the van and drives it off.
const clearingShare = 0.8;
// Time constant of the easing towards the scroll position, in ms: as far behind
// the scroll as the 3D scene (its spring in hero-scene/scene.js).
const smoothing = 90;

function isScrubbed(animation: Animation): animation is CSSAnimation {
  return (
    animation instanceof CSSAnimation &&
    animation.animationName.startsWith("scrub-")
  );
}

// Pins the hero for a stretch of scroll and plays its "scrub-" animations by
// scroll position instead of by the clock: scrolling down clears the room and
// reveals the copy, scrolling back up furnishes it again.
export function HeroStage({ children }: { children: ReactNode }) {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = section.current;
    if (!root) return;
    let animations: CSSAnimation[] = [];
    let target = 0;
    let current = 0;
    let frame = 0;
    let last = 0;

    function collect() {
      animations = root!.getAnimations({ subtree: true }).filter(isScrubbed);
      animations.forEach((animation) => {
        animation.pause();
        animation.currentTime = current;
      });
    }

    function progress() {
      const box = root!.getBoundingClientRect();
      const range = box.height - window.innerHeight;
      if (range <= 0) return 0;
      return Math.min(Math.max(-box.top / range, 0), 1);
    }

    function tick(now: number) {
      const step = last ? now - last : 16;
      last = now;
      current += (target - current) * (1 - Math.exp(-step / smoothing));
      if (Math.abs(target - current) < 0.5) current = target;
      animations.forEach((animation) => {
        animation.currentTime = current;
      });
      if (current === target) {
        frame = 0;
        last = 0;
      } else {
        frame = requestAnimationFrame(tick);
      }
    }

    function update() {
      target = Math.min(progress() / clearingShare, 1) * timeline;
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function refresh() {
      collect();
      update();
    }

    refresh();
    // Start from the position the page was opened at, without easing in.
    current = target;
    animations.forEach((animation) => {
      animation.currentTime = current;
    });

    const resize = new ResizeObserver(refresh);
    resize.observe(root);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    motion.addEventListener("change", refresh);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      motion.removeEventListener("change", refresh);
      window.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <section ref={section} className="hero" aria-labelledby="hero-title">
      <div className="hero-sticky">{children}</div>
    </section>
  );
}
