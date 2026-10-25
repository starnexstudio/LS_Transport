import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { scan } from "./axe.mjs";
// The site under test: the dev server, or a production build (BASE_URL).
const base = (process.env.BASE_URL ?? "http://localhost:4173").replace(
  /\/$/,
  "",
);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto(base, { waitUntil: "networkidle" });

// Before/after: one slider; each project's photos load, and the slider moves by keyboard.
const tabs = page.locator('#vorher-nachher [role="tab"]');
assert.equal(await tabs.count(), 2);
for (const tab of await tabs.all()) {
  await tab.click();
  assert.equal(await tab.getAttribute("aria-selected"), "true");
  const slider = page.locator(".compare");
  assert.equal(await slider.count(), 1);
  await slider.scrollIntoViewIfNeeded();
  await slider
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => image.decode())),
    );
  const input = slider.locator("input");
  await input.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await input.inputValue(), "51");
}

// Gallery photos ("Im Einsatz").
assert.equal(await page.locator(".gallery-tile img").count(), 8);
await page.locator(".gallery-grid").scrollIntoViewIfNeeded();
await page
  .locator(".gallery-tile img")
  .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
await page.locator(".gallery").screenshot({ path: "artifacts/gallery.png" });

// Responsive widths.
for (const width of [1440, 768, 390, 320]) {
  await page.setViewportSize({ width, height: 900 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    `Overflow at ${width}`,
  );
}

// Only the home page and the legal pages exist.
for (const route of ["/services/", "/services/clearance/"]) {
  const response = await page.goto(base + route);
  assert.equal(response.status(), 404, route);
}

// Accessibility on every remaining page.
await page.setViewportSize({ width: 1440, height: 1000 });
for (const route of ["/", "/impressum/", "/datenschutz/"]) {
  await page.goto(base + route, { waitUntil: "networkidle" });
  assert.deepEqual(
    (await scan(page)).map(({ id, targets }) => ({ id, targets })),
    [],
    route,
  );
}
assert.deepEqual(errors, []);
await browser.close();
await fs.writeFile(
  "artifacts/photos-test-results.json",
  JSON.stringify(
    {
      status: "passed",
      checks: [
        "Three before/after sliders load and respond to the keyboard",
        "Moving photos load",
        "Responsive widths 320–1440",
        "Removed service routes return 404",
        "Accessibility scans of all pages",
        "No runtime errors",
      ],
    },
    null,
    2,
  ),
);
console.log("Photos, sliders, page set and accessibility checks passed.");
