import type { Metadata } from "next";
import { basePath } from "@/lib/base-path";

// Where the site is published and whether search engines may list it. Both are
// read from the build environment (DEPLOYMENT.md). Without SITE_URL the build is a
// preview: every page is noindex and no absolute URLs (canonical, Open Graph,
// sitemap) are published, so no placeholder domain can reach the public site.
const configured = process.env.SITE_URL?.trim().replace(/\/+$/, "") ?? "";
export const siteUrl = configured || null;
export const indexable =
  siteUrl !== null && process.env.ALLOW_INDEXING === "true";

// The site's files live under the base path, so SITE_URL has to end with it
// (e.g. https://user.github.io/Repo for basePath "/Repo"); stop the build if not.
if (siteUrl && new URL(siteUrl).pathname.replace(/\/+$/, "") !== basePath) {
  throw new Error(
    `SITE_URL (${siteUrl}) must end with the base path "${basePath}".`,
  );
}

/** Absolute URL of a page or file, e.g. absolute("/impressum/"). */
export function absolute(path: string) {
  return siteUrl ? `${siteUrl}${path}` : null;
}

export const shareImage = {
  path: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "L&S-Logo, ein Zimmer voller Umzugskartons und ein Umzugswagen in L&S-Farben (Illustration)",
};

export const siteName = "L&S Entrümpelung & Demontage";
export const titles = {
  default: "L&S | Entrümpelung & Demontage",
  template: `%s | ${siteName}`,
};
export const homeDescription =
  "Platz für Neues. Entrümpelung, fachgerechte Entsorgung, Demontage, Möbeltransport und Reinigung. Deutschlandweit nach Absprache. Jetzt unverbindlich anfragen.";

/** Per-page title, description and, once SITE_URL is set, canonical and Open Graph URLs. */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title?: string;
  description: string;
  path: string;
}): Metadata {
  const url = absolute(path);
  const image = absolute(shareImage.path);
  return {
    ...(title && { title }),
    description,
    ...(url && {
      alternates: { canonical: url },
      openGraph: {
        type: "website",
        locale: "de_DE",
        siteName,
        url,
        title: title ? `${title} | ${siteName}` : titles.default,
        description,
        ...(image && { images: [{ ...shareImage, url: image }] }),
      },
    }),
  };
}
