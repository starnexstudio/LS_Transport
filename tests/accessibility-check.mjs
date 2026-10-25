import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import { scan } from "./axe.mjs";
// The site under test: the dev server, or a production build (BASE_URL).
const base = (process.env.BASE_URL ?? "http://localhost:4173").replace(
  /\/$/,
  "",
);
const browser = await chromium.launch({ channel: "chrome", headless: true });
// Reduced motion: scans see each element's final colours, not a frame of its
// entrance animation.
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();
const reports = [];
const report = async (state, include) =>
  reports.push({ state, violations: await scan(page, include) });
for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: 900 });
  for (const route of ["/", "/impressum/", "/datenschutz/", "/missing-page/"]) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await report(`${width} ${route}`);
  }
  await page.goto(base, { waitUntil: "networkidle" });
  if (width === 390) {
    await page.getByRole("button", { name: "Menü öffnen" }).click();
    await report(`${width} menu open`, ".header");
    await page.keyboard.press("Escape");
  }
  await page.locator(".hero-service-card").first().click();
  await report(`${width} service dialog`, ".service-dialog");
  await page.keyboard.press("Escape");
  const submit = page.getByRole("button", {
    name: "E-Mail-Anfrage vorbereiten",
  });
  await submit.click();
  await report(`${width} form errors`, ".inquiry");
  await page.locator("#service").selectOption({ index: 1 });
  await page.locator("#name").fill("Erika Muster");
  await page.locator("#place").fill("10115 Berlin");
  await page.locator("#message").fill("Ein Kleiderschrank, 2. Stock.");
  await submit.click();
  await report(`${width} email draft`, ".inquiry");
}
await fs.writeFile(
  "artifacts/accessibility-results.json",
  JSON.stringify(reports, null, 2),
);
await browser.close();
const failed = reports.filter((r) => r.violations.length);
if (failed.length) {
  console.log(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
} else
  console.log(
    `No axe violations (WCAG 2.2 A/AA and best practices) in ${reports.length} page states. Automated checks cover only part of WCAG.`,
  );
