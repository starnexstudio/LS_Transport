import type { MetadataRoute } from "next";
import { absolute, indexable } from "@/lib/site";

// Written once at build time (static export).
export const dynamic = "force-static";

// Crawlers may read every page, so a preview's noindex tags are seen and obeyed;
// the sitemap is announced only once the site may be indexed. Crawlers read
// robots.txt only at the root of a domain, so it takes effect on a custom domain.
export default function robots(): MetadataRoute.Robots {
  const sitemap = indexable ? absolute("/sitemap.xml") : null;
  return {
    rules: { userAgent: "*", allow: "/" },
    ...(sitemap && { sitemap }),
  };
}
