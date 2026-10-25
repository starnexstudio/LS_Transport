import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
// The site under test: the dev server, or a production build (BASE_URL).
const base = (process.env.BASE_URL ?? "http://localhost:4173").replace(
  /\/$/,
  "",
);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const failures = [];
page.on("pageerror", (error) => failures.push(error.message));
await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
assert.equal(await page.locator("html").getAttribute("lang"), "de");
// The skip link moves focus to the main content.
await page.keyboard.press("Tab");
await page.keyboard.press("Enter");
assert.equal(await page.evaluate(() => document.activeElement?.id), "inhalt");
// Requesting a service from its dialog preselects it and focuses the form.
await page.locator(".hero-service-card").nth(1).click();
await page.getByRole("button", { name: "Diese Leistung anfragen" }).click();
assert.equal(await page.evaluate(() => document.activeElement?.id), "service");
assert.equal(
  await page.locator("#service").inputValue(),
  "Fachgerechte Entsorgung",
);
// The floating call and WhatsApp buttons step aside over the form.
await page.waitForFunction(() =>
  document.querySelector(".floating-contact")?.classList.contains("is-hidden"),
);
await page.evaluate(() => window.scrollTo(0, 0));
await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
for (const width of [1440, 1024, 768, 390, 320]) {
  await page.setViewportSize({ width, height: 900 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    `Horizontal overflow at ${width}px`,
  );
}
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
await page.getByRole("button", { name: "Menü öffnen" }).click();
await page
  .getByRole("navigation")
  .getByRole("link", { name: "Ablauf", exact: true })
  .click();
assert.equal(
  await page
    .getByRole("button", { name: "Menü öffnen" })
    .getAttribute("aria-expanded"),
  "false",
);
// A tap outside the open menu closes it.
await page.evaluate(() => window.scrollTo(0, 0));
await page.getByRole("button", { name: "Menü öffnen" }).click();
await page.mouse.click(5, 600);
assert.equal(
  await page.locator(".menu-toggle").getAttribute("aria-expanded"),
  "false",
);
await page.locator("#service").selectOption("Reinigung nach der Räumung");
assert.equal(
  await page.locator("#service").inputValue(),
  "Reinigung nach der Räumung",
);
for (const field of ["#service", "#name", "#place", "#message"])
  assert.ok(
    await page.locator(field).evaluate((element) => element.required),
    `${field} is announced as required`,
  );
await page.getByRole("button", { name: "E-Mail-Anfrage vorbereiten" }).click();
assert.equal(
  await page.locator("#name-error").innerText(),
  "Bitte geben Sie Ihren Namen ein.",
);
await page.locator("#name").fill("Erika Muster");
await page.locator("#place").fill("10115 Berlin");
await page
  .locator("#message")
  .fill("Ein Kleiderschrank, 2. Stock. Termin nach Absprache.");
await page.getByRole("button", { name: "E-Mail-Anfrage vorbereiten" }).click();
assert.ok(
  await page
    .getByRole("heading", { name: "Ihr Entwurf ist fertig." })
    .isVisible(),
);
const mailto = await page
  .getByRole("link", { name: "E-Mail öffnen" })
  .getAttribute("href");
assert.match(mailto, /^mailto:Info@entruempelung-demontage.de/);
assert.match(decodeURIComponent(mailto), /Erika Muster/);
assert.match(decodeURIComponent(mailto), /10115 Berlin/);
await page
  .locator("summary")
  .filter({ hasText: "Was kostet mein Auftrag?" })
  .click();
assert.ok(
  await page
    .locator("details[open]")
    .filter({ hasText: "Der Preis hängt" })
    .isVisible(),
);
assert.ok(
  await page
    .locator(".hero-poster")
    .evaluate((image) => image.complete && image.naturalWidth > 0),
);
// Inner pages: the site header and footer, a title of their own, no overflow.
const titles = new Set([await page.title()]);
await page.setViewportSize({ width: 320, height: 800 });
for (const route of ["impressum", "datenschutz"]) {
  const response = await page.goto(`${base}/${route}`);
  assert.equal(response.status(), 200);
  assert.ok(await page.locator("header .brand").isVisible(), `${route} header`);
  assert.ok(await page.locator("footer").isVisible(), `${route} footer`);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    `Horizontal overflow on /${route} at 320px`,
  );
  titles.add(await page.title());
}
const missing = await page.goto(`${base}/missing-page`);
assert.equal(missing.status(), 404);
assert.ok(
  await page.getByRole("heading", { name: "Hier ist viel Platz." }).isVisible(),
);
assert.ok(await page.locator("header .brand").isVisible(), "404 header");
titles.add(await page.title());
assert.equal(titles.size, 4, `Page titles repeat: ${[...titles]}`);
assert.deepEqual(failures, []);
await browser.close();
await fs.writeFile(
  "artifacts/test-results.json",
  JSON.stringify(
    {
      status: "passed",
      viewports: [1440, 1024, 768, 390, 320],
      checks: [
        "German language",
        "No horizontal overflow",
        "Skip link focus",
        "Service request focuses the form",
        "Floating contact steps aside over the form",
        "Mobile navigation (also closes on an outside tap)",
        "Required fields exposed",
        "Service preselection",
        "Form validation",
        "Email draft contents",
        "FAQ expansion",
        "Image loading",
        "Legal routes with header and footer, no overflow at 320px",
        "Custom 404 with header",
        "Unique page titles",
        "No runtime exceptions",
      ],
    },
    null,
    2,
  ),
);
console.log("All browser checks passed. Screenshots saved to artifacts/.");
