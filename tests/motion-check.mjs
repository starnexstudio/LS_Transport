import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "no-preference",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://localhost:3000");
assert.equal(
  await page
    .locator(".hero-copy h1")
    .evaluate((el) => getComputedStyle(el).animationName),
  "entrance-rise",
);
await page.emulateMedia({ reducedMotion: "reduce" });
await page.waitForFunction(
  () =>
    document.getAnimations().filter((a) => a.playState === "running").length ===
    0,
);
assert.equal(
  await page
    .locator(".hero-copy h1")
    .evaluate((el) => getComputedStyle(el).animationName),
  "none",
);
for (const width of [1440, 390, 320]) {
  await page.setViewportSize({ width, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
}
await page.setViewportSize({ width: 390, height: 844 });
await page.getByRole("button", { name: "Open menu" }).click();
await page.getByRole("button", { name: "Close menu" }).press("Escape");
assert.equal(
  await page
    .getByRole("button", { name: "Open menu" })
    .getAttribute("aria-expanded"),
  "false",
);
const noScript = await browser.newContext({
  javaScriptEnabled: false,
  reducedMotion: "reduce",
});
const staticPage = await noScript.newPage();
await staticPage.goto("http://localhost:3000");
assert.ok(await staticPage.locator("h1").isVisible());
assert.ok(await staticPage.locator(".inquiry").isVisible());
assert.equal(
  await staticPage
    .locator(".inquiry")
    .evaluate((el) => getComputedStyle(el).opacity),
  "1",
);
assert.deepEqual(errors, []);
await browser.close();
await fs.writeFile(
  "artifacts/motion-test-results.json",
  JSON.stringify(
    {
      status: "passed",
      checks: [
        "Hero entrance",
        "Live reduced-motion preference change",
        "Mobile menu Escape",
        "Responsive overflow",
        "Content visible without JavaScript",
        "No runtime errors",
      ],
    },
    null,
    2,
  ),
);
console.log(
  "Motion, reduced-motion, keyboard and progressive-enhancement checks passed.",
);
