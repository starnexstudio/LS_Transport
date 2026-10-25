# Deployment and production readiness

Status on 25 October 2026: **ready after the configuration listed below.** The code, build and deployment path are ready, and the site can keep running as a preview. Before it goes public under the business's name, the owner must supply the legal details for the Impressum and Datenschutz pages and confirm the items in the launch checklist. Until then every page carries `noindex`.

## How the site is built and hosted

- Next.js 16 with `output: "export"`: `npm run build` writes a fully static site to `out/`. There is no server code, database, form backend or runtime secret.
- `.github/workflows/deploy.yml` builds on every push to `main` (and on a manual run) with Node 24 on Ubuntu, runs the typecheck, and publishes `out/` to GitHub Pages: https://starnexstudio.github.io/LS_Transport/
- The workflow passes the Pages base path (`/LS_Transport`) as `NEXT_PUBLIC_BASE_PATH`. With a custom domain the base path becomes empty on its own.

## Configuration

| Variable | Where | Value | Effect |
|---|---|---|---|
| `NEXT_PUBLIC_BASE_PATH` | set by the workflow | `/LS_Transport` on github.io, empty on a custom domain | Prefix for all pages and files. |
| `SITE_URL` | repository variable | The public address including the base path, without a trailing slash, e.g. `https://starnexstudio.github.io/LS_Transport` or `https://www.example.de` | Adds canonical links, Open Graph tags with the share image (`public/og-image.jpg`) and absolute URLs. The build stops if it does not end with the base path. Unset: no absolute URLs are published. |
| `ALLOW_INDEXING` | repository variable | `true` only after launch approval | With `SITE_URL` set: removes `noindex`, fills `sitemap.xml` and names it in `robots.txt`. Otherwise every page is `noindex` and the sitemap is empty. |

Repository variables are under Settings → Secrets and variables → Actions → Variables. They are not secrets; nothing in this site needs one. Contact details (email, phone, WhatsApp) are in `lib/content.ts`.

`robots.txt` takes effect only at the root of a domain, so on `starnexstudio.github.io/LS_Transport/` only the `noindex` tags keep the preview out of search results. `robots.txt` always allows crawling, so crawlers can see those tags.

## Deploy

1. Make the change on a branch, run the checks below, and merge or push to `main`.
2. The "Deploy to GitHub Pages" workflow builds and publishes. Follow it under Actions; the deploy job links the live URL.
3. Open the live site and check the home page, `/impressum/`, `/datenschutz/` and a missing page (it must return the 404 page).

The repository's Pages source is still "Deploy from a branch". GitHub then also builds the README into a page on every push, and the workflow waits up to five minutes for that build so the site goes out last. Setting Settings → Pages → Build and deployment → Source to "GitHub Actions" removes that race (recommended; not changed by this audit).

### Custom domain

1. Settings → Pages → Custom domain: enter the domain, then create the DNS records GitHub shows (CNAME for `www`, A/AAAA records for the apex).
2. Once the certificate is issued, enable "Enforce HTTPS".
3. Set `SITE_URL` to `https://<domain>` (no base path) and re-run the workflow.

## Check a build locally

Use the same base path as GitHub Pages and serve `out/` on port 4173 (stop the dev server first). In Git Bash, prefix each command with `MSYS_NO_PATHCONV=1`, or it rewrites `/LS_Transport` into a Windows path.

```sh
NEXT_PUBLIC_BASE_PATH=/LS_Transport npm run build
BASE_PATH=/LS_Transport npm run preview
```

Then, in a second terminal:

```sh
export BASE_URL=http://localhost:4173/LS_Transport
node tests/browser-check.mjs
node tests/accessibility-check.mjs
node tests/photos-check.mjs
node tests/motion-check.mjs
```

`npm run preview` (`tests/serve.mjs`) behaves like GitHub Pages: a redirect to the trailing slash, `404.html` with status 404, gzip for text files.

Builds made on Windows name the route prefetch files `__next.impressum/__PAGE__.txt` instead of `__next.impressum.__PAGE__.txt` (a Next.js path bug), so a local Windows build logs 404s for them and falls back to a normal fetch. The Linux build in CI is correct; deploy only from CI.

## Rollback

- Preferred: `git revert <commit>` on `main` and push; the workflow redeploys the previous state.
- Faster, temporary: Actions → an earlier successful "Deploy to GitHub Pages" run → Re-run all jobs. It rebuilds that run's commit. The next push to `main` deploys `main` again.

## Launch checklist (owner and external)

Required before the site is public under the business's name:

- [ ] Impressum: full name of the owner or the company, a serviceable address, and, where they apply, representatives, register entry and VAT ID (`app/impressum/page.tsx`).
- [ ] Datenschutz: the responsible party, the final hosting and email providers, legal bases, retention periods and data-subject rights, reviewed by someone qualified (`app/datenschutz/page.tsx`). It currently names GitHub Pages as the preview host.
- [ ] Confirm that L&S may publish the before/after photos (`ASSET_NOTES.md`, "Owner-supplied photos"); their origin is not recorded. If they are not L&S jobs, label them as example photos.
- [ ] Confirm these statements or have them changed: "Rund um die Uhr erreichbar" (contact section and FAQ), "Deutschlandweit nach Absprache" (FAQ, meta description), and "Kostenlose Besichtigung vor Ort" on the 3D van and its poster images (`components/hero-scene/truck.js`; changing it means re-rendering the posters).
- [ ] Decide the domain, then set `SITE_URL`; set `ALLOW_INDEXING=true` once the items above are done.

Optional:

- [ ] Real reviews and figures for the stats band and reviews section: replace the sample content in `lib/showcase.ts` and set `sample = false`. The preview shows the invented ones, unlabelled, for demos; once `ALLOW_INDEXING=true` is set, a build leaves both sections out until they are real.
- [ ] Real job photos for the "Im Einsatz" gallery, which currently shows labelled symbol images.
- [ ] Pages source "GitHub Actions" (see Deploy).

## Audit, October 2026

Scope: every page (home, Impressum, Datenschutz, 404) at 320, 360, 390, 480, 600, 768, 900, 1024, 1100, 1280, 1440 and 1920 px; all interactive features; the form; content and claims; accessibility; SEO; performance; security; and the deployment path. Tested on the production export served like GitHub Pages.

### Fixed

- **Floating call/WhatsApp buttons** covered the inquiry form, its submit button and the footer links. They now step aside over the contact section and the footer as well as the hero buttons, form a labelled landmark, and fade out properly; focused elements are kept clear of them (`scroll-padding-bottom`).
- **Inner pages** (Impressum, Datenschutz, 404) had no site header, navigation or footer, the same title as the home page (404), and the Datenschutz heading overflowed at 320 px. They now share the header on a teal band and the footer (`components/subpage.tsx`), each has its own title and description, and the heading hyphenates.
- **Form:** required fields are announced as required; the name and place fields stack wherever two columns would clip their placeholders (768 px); when copying is blocked, the draft text opens and is selected for manual copying; very long drafts get a hint that some email programs truncate them.
- **Focus:** the skip link now moves focus to the main content; "Diese Leistung anfragen" moves focus to the preselected service in the form; the mobile menu also closes on a tap outside it.
- **Content:** the before/after intro claimed "Echte Räume, echte Ergebnisse", which the photo records do not support; it now describes the comparison only. The gallery is captioned as symbol images. The Impressum image credits named an image no longer used and missed the current ones; they now list the actual sources. Datenschutz now covers the phone and WhatsApp links and the current host.
- **SEO:** central site configuration (`lib/site.ts`), per-page titles and descriptions, canonical and Open Graph tags and a 1200 × 630 share image once `SITE_URL` is set, `robots.txt`, `sitemap.xml`, theme colour. No placeholder domain is published.
- **Accessibility:** the before/after panel used `role="tabpanel"` on a `figure`, which that element does not allow; targets in the header navigation and footer are now at least 24 px high.
- **Runtime error:** leaving the home page while the 3D scene compiled its shaders threw "Cannot read properties of undefined (reading 'isReady')"; the scene now waits for pending compiles before freeing GPU resources.
- **Performance:** the hero poster (the mobile LCP image) loads at high priority; the header and footer use a 440 px logo (33 KB instead of 86 KB); the display font no longer ships an unused width axis (preloaded file 90 KB → 35 KB, rendering pixel-identical).
- **Security and dependencies:** Next.js 16.3.6 → 16.4.2 (`npm audit` reported a critical advisory before, 0 vulnerabilities after); `.env` files are ignored by git; CI builds on Node 24 (Node 20 is end-of-life) and typechecks before building.
- **Clean-up:** six unused images that were still deployed were removed, among them a Flickr photo whose licence could not be verified (`ASSET_NOTES.md`); dead CSS removed; the dev server uses port 4173; Prettier passes (the hand-formatted 3D scene code is excluded).

### Checks and results

- `npm run typecheck`, `npx prettier --check`: pass. `npm audit`: 0 vulnerabilities. Secret scan of tracked files: nothing found.
- `npm run build` (Next.js 16.4.2): 7 static routes (3 pages, 404, icon, `robots.txt`, `sitemap.xml`), `out/` 7.3 MB, of which 3D assets about 3.6 MB load after the page is interactive.
- `tests/browser-check.mjs`, `tests/photos-check.mjs`, `tests/motion-check.mjs`: pass.
- `tests/accessibility-check.mjs`: axe finds no WCAG 2.2 A/AA or best-practice violations in 15 states (4 pages × 2 widths, open menu, service dialog, form errors, email draft). The large faded service numbers and the "L&S." wordmark are excluded as decoration (aria-hidden; WCAG 1.4.3 exempts decorative text).
- Scripted keyboard and pointer pass: skip link, navigation, service dialog (focus moves in, Escape and backdrop close, focus returns), before/after tabs and slider, FAQ, form errors and focus, mobile menu (Escape, link, outside tap).
- Layout: no horizontal overflow, clipped text or controls under 24 px on any page at the twelve widths above; reflow at 200 % zoom (720 CSS px) without horizontal scrolling.
- Lab performance (production build with gzip, median of 3 runs; field data does not exist yet, since the site is unlisted and has no analytics):

| Profile | LCP | CLS | Total blocking time | Slowest interaction |
|---|---|---|---|---|
| Phone 390 × 844, 4× CPU slowdown, 1.6 Mbit/s, 150 ms RTT | 2.2 s (hero poster) | 0.000 | 0.69 s | 88 ms (max 144 ms) |
| Desktop 1440 × 900, 10 Mbit/s, 40 ms RTT | 0.54 s (hero title) | 0.001 | 0.56 s | 160 ms (max 168 ms) |

  The interaction figures are Event Timing durations for real clicks and taps a few seconds after load (menu, service card, FAQ, form), a lab stand-in for INP. Blocking time comes mostly from starting the 3D scene: with WebGL disabled (poster only) the desktop figure drops to 0.10 s. On the slowest phones the scene falls back to the poster by design.

### Not covered or not verifiable here

- Screen readers (NVDA, VoiceOver, TalkBack) were not tested; automated checks and the keyboard pass do not establish WCAG conformance on their own.
- Real devices (iOS Safari, Android Chrome, Firefox) were not tested; all browser runs used Chrome on Windows.
- Field Core Web Vitals: collect them after launch (Search Console or the Chrome UX Report once there is traffic).
- GitHub Pages does not allow custom response headers, so a Content-Security-Policy, Permissions-Policy and similar headers cannot be set there. The site loads no third-party scripts, sets no cookies and uses no storage, which keeps the exposure small; a host with header control would allow them.
