import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const reports = [];
for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  reports.push({ width, violations: results.violations });
}
await fs.writeFile(
  "artifacts/accessibility-results.json",
  JSON.stringify(reports, null, 2),
);
await browser.close();
const violations = reports.flatMap((r) => r.violations);
console.log(
  JSON.stringify(
    violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
    null,
    2,
  ),
);
if (violations.length) process.exitCode = 1;
else
  console.log("No WCAG A/AA violations detected at desktop or mobile widths.");
