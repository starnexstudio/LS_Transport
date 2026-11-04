import type { Metadata } from "next";
import { basePath } from "@/lib/base-path";
import { business } from "@/lib/content";

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
  path: "/og-share.jpg",
  width: 1200,
  height: 1200,
  alt: "L&S Entrümpelung & Demontagearbeiten – Logo",
};

export const siteName = "L&S Entrümpelung & Demontage";
// The name Google shows above the result (instead of the bare domain). Matches
// the homepage title so both lines of the search result read the same.
export const brandName = "L&S | Entrümpelung & Demontage";
export const titles = {
  default: brandName,
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
        siteName: brandName,
        url,
        title: title ? `${title} | ${siteName}` : titles.default,
        description,
        ...(image && { images: [{ ...shareImage, url: image }] }),
      },
    }),
  };
}

/** WebSite structured data: tells Google which site name to show in results. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brandName,
    alternateName: [siteName, "L&S Entrümpelung"],
    inLanguage: "de-DE",
    ...(siteUrl && {
      url: `${siteUrl}/`,
      // The company and its logo, so Google can link the brand to the site.
      publisher: {
        "@type": "Organization",
        name: business.name,
        url: `${siteUrl}/`,
        logo: `${siteUrl}/icon.png`,
      },
    }),
  };
}
