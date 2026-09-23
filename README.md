# L&S website

A German-language, frontend-only website for L&S Entrümpelung & Demontagearbeiten.

## Development

Requires Node.js 20.9 or later.

```sh
npm install
npm run dev
```

Open http://localhost:3000. The public interface is German; source and documentation use English.

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
npm run typecheck
```

The browser checks cover responsive overflow, navigation, keyboard-operated service tabs, service preselection, form validation, generated mailto contents, FAQ expansion, local image loading, legal pages, the German 404 page, and runtime exceptions. Screenshots and machine-readable results are saved under `artifacts/`.

## Project structure

- `app/`: home page, German legal draft pages, metadata, global styles, favicon, and German not-found page.
- `components/`: shared header, footer, service selector, and inquiry form.
- `lib/content.ts`: confirmed contact information and service content.
- `public/images/`: original supplied logo and generated editorial illustration.
- `tests/`: browser and accessibility checks.

## Inquiry behavior

The form validates locally and prepares an email draft. It never reports that a message was sent. The visitor explicitly opens their email application or copies the draft, then sends it themselves. No form data is sent to a server or saved in browser storage. Photos can be attached in the visitor's email application. A configured email application is required to use mailto; copying provides a fallback.

## Before public launch

- Supply the legal owner's full name, legal entity where applicable, service address, and any applicable registration or tax details.
- Complete and review the legal notice and privacy policy against the actual hosting and email processing arrangements. Current legal routes explicitly identify their incomplete status.
- Confirm the remaining pricing brief: the supplied request ended after “individual price after”. Current public wording only promises an individually agreed price.
- Remove `robots: { index: false, follow: false }` when the website is approved for publication. Add the actual canonical domain once confirmed.
- Replace the illustrative image with authorized business photography if available. The existing image is clearly labeled as illustrative and is not presented as a completed company project.

No phone number, street address, certifications, reviews, fixed prices, or project statistics were invented. No analytics, tracking scripts, cookie storage, or remotely embedded maps are used.

## Service pages and direct contact

`/services` lists five detailed routes generated from `lib/service-details.ts`. Each route includes scope, preparation, pricing factors, a relevant question, related services, and a preselected inquiry form.

Phone and WhatsApp links are implemented in `components/contact-actions.tsx`. Set `business.phone` and `business.whatsapp` in `lib/content.ts` to the confirmed international numbers. These values deliberately remain empty until supplied by the owner; the corresponding controls stay hidden to avoid publishing fabricated numbers or broken destinations. Call links use `tel:`; WhatsApp links use `wa.me` with a German draft message and open only after a visitor clicks. No WhatsApp script is embedded.

The homepage includes two licensed Pexels photographs of packed moving boxes and protected living-room furniture. They are labeled as illustrative photos, not L&S projects or a before/after pair. See `ASSET_NOTES.md` for provenance.

## Motion

`app/motion.css` defines coordinated hero entrances and small hover/focus transitions. `components/motion-effects.tsx` uses IntersectionObserver and the Web Animations API for one-time scroll reveals; it does not hide server-rendered content or install scroll listeners. Service-tab transitions preserve DOM and focus. The reduced-motion preference disables CSS and JavaScript animations, including when changed while the page is open. Run `node tests/motion-check.mjs` with the dev server running to verify these behaviors.
