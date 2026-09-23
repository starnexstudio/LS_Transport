import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const routes = [
  "clearance",
  "disposal",
  "dismantling",
  "furniture-transport",
  "furniture-assembly",
];
for (const slug of routes) {
  const response = await page.goto(`http://localhost:3000/services/${slug}`, {
    waitUntil: "networkidle",
  });
  assert.equal(response.status(), 200);
  const heading = await page.locator("h1").innerText();
  assert.equal(await page.locator("#service").inputValue(), heading);
  assert.ok((await page.title()).includes(heading));
  assert.equal(await page.locator(".service-scope article").count(), 3);
  await page.locator(".service-planning summary").click();
  assert.ok(await page.locator(".service-planning details[open]").isVisible());
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${slug} overflow at ${width}`,
    );
  }
}
for (const route of ["/", "/services", "/services/clearance"]) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`http://localhost:3000${route}`, {
    waitUntil: "networkidle",
  });
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
await page.screenshot({
  path: "artifacts/service-desktop.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "artifacts/service-mobile.png", fullPage: true });
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
assert.equal(await page.locator(".moving-photo img").count(), 2);
await page.locator(".moving-photo-grid").scrollIntoViewIfNeeded();
await page.locator(".moving-photo img").evaluateAll(images => Promise.all(images.map(image => image.decode())));
for (const image of await page.locator(".moving-photo img").all())
  assert.ok(
    await image.evaluate((img) => img.complete && img.naturalWidth > 0),
  );
assert.match(
  await page.locator(".photo-example").innerText(),
  /keinen Auftrag von L&S/,
);
assert.equal(
  await page.locator(".photo-example a").last().getAttribute("href"),
  "https://www.pexels.com/license/",
);
await page.setViewportSize({ width: 1440, height: 1000 });
await page
  .locator(".photo-example")
  .screenshot({ path: "artifacts/photo-example.png" });
assert.deepEqual(errors, []);
await browser.close();
await fs.writeFile(
  "artifacts/service-test-results.json",
  JSON.stringify(
    {
      status: "passed",
      routes,
      checks: [
        "Static service routes",
        "Service-specific metadata",
        "Preselected inquiry",
        "Service FAQ",
        "Responsive widths 320–1440",
        "Accessibility scans",
        "Licensed moving image loading and attribution",
        "No runtime errors",
      ],
      contactStatus: "Phone and WhatsApp controls await confirmed numbers",
    },
    null,
    2,
  ),
);
console.log(
  "Service pages, moving photos, responsive layouts and accessibility checks passed.",
);

