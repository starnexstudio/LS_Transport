import AxeBuilder from "@axe-core/playwright";

// WCAG 2.0–2.2 A and AA rules plus axe's best practices (landmarks, headings).
export const tags = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "best-practice",
];

// Pure decoration, hidden from assistive technology (aria-hidden): the large
// faded service numbers and the "L&S." wordmark. WCAG 1.4.3 exempts decorative
// text from the contrast minimum, which axe cannot tell on its own.
const decorative = [".hero-service-number", ".process-wordmark"];

/** Axe violations on the page (or inside `include`), as { id, targets }. */
export async function scan(page, include) {
  // Let entrance animations (fades, rises) finish, so axe measures final colours
  // rather than a frame mid-fade. Looping and scroll-driven animations never
  // finish; skip them.
  await page.evaluate(() =>
    Promise.race([
      Promise.all(
        document
          .getAnimations()
          .filter(
            (a) =>
              a.timeline === document.timeline &&
              a.effect?.getComputedTiming().iterations !== Infinity,
          )
          .map((a) => a.finished.catch(() => {})),
      ),
      new Promise((resolve) => setTimeout(resolve, 4000)),
    ]),
  );
  let builder = new AxeBuilder({ page }).withTags(tags);
  if (include) builder = builder.include(include);
  for (const selector of decorative) builder = builder.exclude(selector);
  const { violations } = await builder.analyze();
  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    targets: v.nodes.map((n) => n.target.join(" ")),
    summary: v.nodes[0]?.failureSummary,
  }));
}
