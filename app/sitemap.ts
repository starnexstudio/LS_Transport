import type { MetadataRoute } from "next";
import { absolute, indexable } from "@/lib/site";

// Written once at build time (static export).
export const dynamic = "force-static";

const pages = ["/", "/impressum/", "/datenschutz/"];

// Lists the pages once the site may be indexed (SITE_URL and ALLOW_INDEXING);
// a preview publishes an empty sitemap rather than placeholder URLs.
export default function sitemap(): MetadataRoute.Sitemap {
  if (!indexable) return [];
  return pages.map((path) => ({ url: absolute(path)! }));
}
