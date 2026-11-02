// Inspect the actual static export before deploying it, without a browser/server.
// --preview checks that an unapproved build still keeps its pages out of search.
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const preview = process.argv.includes("--preview");
const origin = "https://ls-entruempelung-demontage.de";
const pages = ["/", "/impressum/", "/datenschutz/"];
const errors = ["404.html", "404/index.html", "_not-found/index.html"];

// Next.js serializes these attributes with quoted values. Ignore scripts and
// comments so metadata strings in the React payload cannot produce false passes.
function tags(html, name) {
  const markup = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  return [...markup.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(
    ([tag]) =>
      Object.fromEntries(
        [...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(
          ([, key, , value]) => [key.toLowerCase(), value],
        ),
      ),
  );
}

function directives(html) {
  return tags(html, "meta")
    .filter((tag) =>
      /^(robots|googlebot(?:-news)?|x-robots-tag)$/i.test(
        tag.name ?? tag["http-equiv"] ?? "",
      ),
    )
    .map((tag) => tag.content ?? "")
    .join(", ");
}

for (const route of pages) {
  const html = await fs.readFile(`out${route}index.html`, "utf8");
  const robots = directives(html);
  if (preview) {
    assert.match(robots, /\bnoindex\b/i, `${route}: preview must stay noindex`);
  } else {
    assert.doesNotMatch(
      robots,
      /\b(noindex|nofollow|none)\b/i,
      `${route}: public production page blocks indexing`,
    );
    assert.deepEqual(
      tags(html, "link")
        .filter((tag) => tag.rel?.toLowerCase() === "canonical")
        .map((tag) => tag.href),
      [`${origin}${route}`],
      `${route}: incorrect canonical URL`,
    );
    assert.doesNotMatch(
      html,
      /\/LS_Transport(?:\/|\b)/i,
      `${route}: obsolete base path`,
    );
  }
  console.log(
    `${route}: ${robots || "indexing allowed (no restrictive meta)"}`,
  );
}

// Keep Next.js's intentional error-page restrictions in production and previews.
for (const file of errors) {
  const html = await fs.readFile(`out/${file}`, "utf8");
  assert.match(directives(html), /\bnoindex\b/i, `${file}: must stay noindex`);
}
assert.match(
  await fs.readFile("preview-3d/index.html", "utf8"),
  /<meta\s+name="robots"\s+content="noindex"\s*\/?\s*>/i,
  "The standalone 3D preview must stay noindex",
);

const robots = await fs.readFile("out/robots.txt", "utf8");
assert.match(robots, /^User-Agent: \*\s*\r?\nAllow: \/\s*$/im);
assert.doesNotMatch(robots, /^Disallow:\s*\S+/im);
const sitemaps = [...robots.matchAll(/^Sitemap:\s*(\S+)/gim)].map((m) => m[1]);
assert.deepEqual(sitemaps, preview ? [] : [`${origin}/sitemap.xml`]);
const sitemap = await fs.readFile("out/sitemap.xml", "utf8");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
assert.deepEqual(
  urls.sort(),
  preview ? [] : pages.map((p) => `${origin}${p}`).sort(),
);
console.log(
  `SEO export checks passed (${preview ? "preview" : "production"}).`,
);
