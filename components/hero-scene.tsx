"use client";
import { useEffect, useRef } from "react";
import { asset, basePath } from "@/lib/base-path";

// The 3D scene in the hero's middle band (three.js, loaded after the page): a room
// packed for the move empties into the L&S van, which drives off. A poster stands in
// while it loads and without WebGL; with reduced motion a before / after pair
// rendered from the scene replaces it.
export function HeroScene() {
  const band = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = band.current?.closest<HTMLElement>(".hero-sticky");
    if (!stage) return;
    let destroy: (() => void) | undefined;
    let cancelled = false;
    let idle = 0;
    // The scene (three.js and about 5 MB of models) starts once the page has loaded
    // and the browser is idle, so it never competes with the first paint; the poster,
    // which shows the same first frame, stands in until then.
    const begin = () => {
      const go = () =>
        import("./hero-scene/scene.js").then(({ mountHeroScene }) => {
          if (!cancelled) destroy = mountHeroScene({ stage, base: basePath });
        });
      // Safari has no requestIdleCallback.
      idle =
        typeof window.requestIdleCallback === "function"
          ? window.requestIdleCallback(go, { timeout: 1500 })
          : window.setTimeout(go, 300);
    };
    if (document.readyState === "complete") begin();
    else addEventListener("load", begin, { once: true });
    return () => {
      cancelled = true;
      removeEventListener("load", begin);
      if (typeof window.cancelIdleCallback === "function")
        window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
      destroy?.();
    };
  }, []);
  return (
    <>
      <div
        ref={band}
        className="hero-scene"
        role="img"
        aria-label="Ein voll gepacktes Zimmer wird geräumt: Möbel und Kartons wandern in den L&S-Umzugswagen, der Wagen fährt ab, das Zimmer ist leer."
      >
        <picture>
          <source
            media="(max-width: 760px)"
            srcSet={asset("/hero-3d/fallback-before-m.webp")}
          />
          <img
            className="hero-poster"
            src={asset("/hero-3d/fallback-before.webp")}
            alt=""
          />
        </picture>
      </div>
      <div className="hero-still" role="group" aria-label="Vorher und nachher">
        <figure>
          <img
            src={asset("/hero-3d/fallback-before.webp")}
            alt="Vorher: das Zimmer ist voll mit Möbeln und Umzugskartons, der L&S-Umzugswagen wartet mit offener Hecktür."
          />
          <figcaption>Vorher</figcaption>
        </figure>
        <figure>
          <img
            src={asset("/hero-3d/fallback-after.webp")}
            alt="Nachher: das Zimmer ist leer und besenrein, der Umzugswagen ist abgefahren."
          />
          <figcaption>Nachher – geräumt und besenrein</figcaption>
        </figure>
      </div>
    </>
  );
}
