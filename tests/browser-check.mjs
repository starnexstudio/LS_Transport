import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const failures = [];
page.on("pageerror", (error) => failures.push(error.message));
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
assert.equal(await page.locator("html").getAttribute("lang"), "de");
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
  .getByRole("link", { name: "Leistungen", exact: true })
  .click();
assert.equal(
  await page
    .getByRole("button", { name: "Menü öffnen" })
    .getAttribute("aria-expanded"),
  "false",
);
await page.getByRole("tab", { name: "04 Möbeltransport & Lieferung" }).click();
assert.match(
  await page.getByRole("tabpanel").innerText(),
  /Von hier nach dort/,
);
await page
  .getByRole("tab", { name: "04 Möbeltransport & Lieferung" })
  .press("ArrowDown");
assert.match(
  await page.getByRole("tabpanel").innerText(),
  /Abgebaut. Angekommen/,
);
await page
  .getByRole("tabpanel")
  .getByRole("link", { name: /anfragen/ })
  .click();
assert.equal(
  await page.locator("#service").inputValue(),
  "Möbelmontage & Demontage",
);
await page.getByRole("button", { name: "E-Mail-Anfrage vorbereiten" }).click();
assert.equal(
  await page.locator("#name-error").innerText(),
  "Bitte geben Sie Ihren Namen an.",
);
await page.locator("#name").fill("Erika Muster");
await page.locator("#place").fill("10115 Berlin");
await page
  .locator("#message")
  .fill("Ein Schrank, 2. Etage. Gewünschter Termin nach Absprache.");
await page.getByRole("button", { name: "E-Mail-Anfrage vorbereiten" }).click();
assert.ok(
  await page
    .getByRole("heading", { name: "Ihr Entwurf ist bereit." })
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
    .filter({ hasText: "Jedes Vorhaben ist anders" })
    .isVisible(),
);
assert.ok(
  await page
    .locator(".hero-visual img")
    .evaluate((image) => image.complete && image.naturalWidth > 0),
);
for (const route of ["legal-notice", "privacy"]) {
  const response = await page.goto(`http://localhost:3000/${route}`);
  assert.equal(response.status(), 200);
  assert.ok(
    await page.getByRole("link", { name: "← Zur Startseite" }).isVisible(),
  );
}
const missing = await page.goto("http://localhost:3000/missing-page");
assert.equal(missing.status(), 404);
assert.ok(
  await page.getByRole("heading", { name: "Hier ist noch Platz." }).isVisible(),
);
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
        "Mobile navigation",
        "Service tabs",
        "Keyboard navigation",
        "Service preselection",
        "German validation",
        "Email draft contents",
        "FAQ expansion",
        "Image loading",
        "Legal routes",
        "German 404",
        "No runtime exceptions",
      ],
    },
    null,
    2,
  ),
);
console.log("All browser checks passed. Screenshots saved to artifacts/.");
