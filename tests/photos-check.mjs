import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto(base, { waitUntil: "networkidle" });

// Before/after sliders: all photos load, and each slider moves by keyboard.
const sliders = page.locator(".compare");
assert.equal(await sliders.count(), 6);
for (const slider of await sliders.all()) {
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

// Moving photos.
assert.equal(await page.locator(".moving-photo img").count(), 2);
await page.locator(".moving-photo-grid").scrollIntoViewIfNeeded();
await page
  .locator(".moving-photo img")
  .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
await page
  .locator(".photo-example")
  .screenshot({ path: "artifacts/photo-example.png" });

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
for (const route of ["/", "/legal-notice/", "/privacy/"]) {
  await page.goto(base + route, { waitUntil: "networkidle" });
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    result.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
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
        "Six before/after sliders load and respond to the keyboard",
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
