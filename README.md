# L&S website

A German-language, frontend-only website for L&S Entrümpelung & Demontagearbeiten.

## Development

Requires Node.js 20.9 or later.

```sh
npm install
npm run dev
```

Open http://localhost:3000. The public interface is in German (`<html lang="de">`); source code and documentation are in English.

## Production

```sh
npm run build
```

The static website is exported to `out/`. Deploy that directory with any static host. No backend, database, external form service, or runtime secrets are needed. Fonts are downloaded at build time by `next/font` and served locally. Images are local and rendered through `next/image` with static-export-compatible settings.

## Verification

With the development server running and Google Chrome installed:

```sh
node tests/browser-check.mjs
node tests/accessibility-check.mjs
node tests/photos-check.mjs
npm run typecheck
```

The browser checks cover responsive overflow, navigation, service preselection, form validation, generated mailto contents, FAQ expansion, local image loading, legal pages, the custom 404 page, and runtime exceptions. Screenshots and machine-readable results are saved under `artifacts/`.

## Project structure

- `app/`: home page, legal draft pages, metadata, global styles, favicon, and not-found page.
- `components/`: shared header, hero (pinned scroll stage with the 3D scene, `components/hero-scene/`), before/after comparisons, footer, and inquiry form.
- `lib/content.ts`: confirmed contact information and service content.
- `lib/showcase.ts`: key numbers, rating and reviews for the stats band and the reviews section (sample content, see below).
- `public/images/`: original supplied logo and generated editorial illustration.
- `public/hero-3d/`: the hero scene's compressed CC0 models, textures, HDRI and posters (built by `preview-3d/scripts/build-web-assets.mjs`).
- `tests/`: browser and accessibility checks.

## Inquiry behavior

The form validates locally and prepares an email draft. It never reports that a message was sent. The visitor explicitly opens their email application or copies the draft, then sends it themselves. No form data is sent to a server or saved in browser storage. Photos can be attached in the visitor's email application. A configured email application is required to use mailto; copying provides a fallback.

## Before public launch

- Supply the legal owner's full name, legal entity where applicable, service address, and any applicable registration or tax details.
- Complete and review the legal notice and privacy policy against the actual hosting and email processing arrangements. Current legal routes explicitly identify their incomplete status.
- Confirm the remaining pricing brief: the supplied request ended after “individual price after”. Current public wording only promises an individually agreed price.
- Remove `robots: { index: false, follow: false }` when the website is approved for publication. Add the actual canonical domain once confirmed.
- Replace the sample reviews, numbers and rating in `lib/showcase.ts` with real ones and set `sample` to `false`; until then those sections stay out of the build.
- Replace the illustrative image with authorized business photography if available. The existing image is clearly labeled as illustrative and is not presented as a completed company project.

No phone number, street address, certifications, reviews, fixed prices, or project statistics were invented. No analytics, tracking scripts, cookie storage, or remotely embedded maps are used.

## Pages and direct contact

The site has three pages: the home page, `/impressum` and `/datenschutz`, plus the 404 page. The home page holds everything else: services, before/after sliders (`components/compare-slider.tsx`, photos in `lib/gallery.ts`), FAQ and the inquiry form.

Phone and WhatsApp links are implemented in `components/contact-actions.tsx`. Set `business.phone` and `business.whatsapp` in `lib/content.ts` to the confirmed international numbers. These values deliberately remain empty until supplied by the owner; the corresponding controls stay hidden to avoid publishing fabricated numbers or broken destinations. Call links use `tel:`; WhatsApp links use `wa.me` with a prefilled message (`whatsappGreeting` in `lib/content.ts`) and open only after a visitor clicks. No WhatsApp script is embedded.

The "Im Einsatz" gallery shows six photos generated in Figma and two licensed Pexels photographs of packed moving boxes and protected living-room furniture. They are not L&S projects. See `ASSET_NOTES.md` for provenance.

## Hero scene

The hero is a pinned stage around a three.js scene (`components/hero-scene.tsx`, code in `components/hero-scene/`): a room packed for the move empties into the L&S van, the van shuts and drives off, and scrolling plays it like a video, forwards and backwards. The prototype it comes from, with notes on the scene, the camera and the rendering, is in `preview-3d/` (its README).

- **Loading:** three.js and the assets (about 3.6 MB in `public/hero-3d/`) start loading as soon as the page is interactive, without waiting for the rest of the page; the models, the textures and the sky download side by side while the room and the van are built. The poster, which shows the same first frame, stands in until the scene is ready (about 2 s on a laptop); the canvas stays hidden until then, so the quality check's test frames never show.
- **Scroll:** the scene and the copy follow the scroll on a critically damped spring, about 65 ms behind it.
- **Speed:** shaders compile in parallel before the first frame (compiling them on first use froze Chrome on Windows for seconds), textures upload a few per frame, and the quality check is spread over frames, so the page keeps scrolling while the scene starts. Per frame, each model is one mesh per material, each open box one mesh, all closed boxes one instanced mesh and the loaded cargo drops out once the van is shut (about 250 draw calls instead of 530). The loop stops while the hero is off screen.
- **Large screens:** the four services in the corners, the buttons centred under the scene. Tablets and phones keep the centred copy.
- **Quality:** the scene times a few frames and picks shadows, resolution and ambient occlusion to suit the device. Most devices draw the scene straight onto a multisampled canvas at the screen's full pixel ratio (4–7 ms a frame on Intel Iris Xe graphics at 1920 × 912 device pixels); only a fast graphics card gets ambient occlusion, which needs full-screen post-processing passes that cost several times more. While the scene moves, the resolution drops only if frames keep coming slower than 40 fps. Without hardware acceleration (WebGL only in software) it shows the poster instead, and it falls back to the poster if frames keep blocking the page. Test hooks: `?quality=high|medium|low`, `?res=0.75` (fixed render scale), `?software` (allow software WebGL).
- **Fallbacks:** without WebGL the poster stays; with reduced motion a before / after pair rendered from the scene replaces it, and nothing is pinned.
- **Assets:** to change models or textures, run `npm run fetch-assets` and `npm run build-web-assets` in `preview-3d/`.

## Trust sections

- **Stats band** (`components/trust-band.tsx`), right under the hero: four key numbers that count up as the band scrolls in, with the rating stars popping in.
- **Im Einsatz** (`components/gallery.tsx`): a bento grid of eight photos that unveil and drift with the scroll (CSS scroll-driven animations where the browser supports them).
- **Kundenstimmen** (`components/reviews.tsx`): the overall rating and one row of review cards drifting by, paused on hover; a still grid with reduced motion.

**The reviews, numbers and rating in `lib/showcase.ts` are sample content, not real.** They are shown only on the dev server, marked "Beispielinhalt", and a production build leaves the stats band and the reviews out while `sample` is `true`. To publish them, replace every entry with real data (for example from the Google Business profile) and set `sample` to `false`.

## Motion

`app/motion.css` defines coordinated hero entrances and small hover/focus transitions. `components/motion-effects.tsx` uses IntersectionObserver and the Web Animations API for one-time scroll reveals; it does not hide server-rendered content or install scroll listeners. The reduced-motion preference disables CSS and JavaScript animations, including when changed while the page is open. Run `node tests/motion-check.mjs` with the dev server running to verify these behaviors.
