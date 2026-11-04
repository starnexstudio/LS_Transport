import type { Metadata } from "next";
import { basePath } from "@/lib/base-path";
import { business, services } from "@/lib/content";

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
  "Entrümpelung, Haushaltsauflösung, Demontage, Entsorgung, Möbeltransport und Reinigung aus Aichach – für die Region Augsburg und deutschlandweit. Jetzt unverbindlich anfragen.";

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

/**
 * Structured data for Google: the site name, the business with its address,
 * contact details and services (local search), and the FAQ.
 */
export function structuredData(faqs: string[][]) {
  const home = siteUrl ? `${siteUrl}/` : undefined;
  const id = (part: string) => (home ? `${home}#${part}` : undefined);
  const { address } = business;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": id("website"),
        name: brandName,
        alternateName: [siteName, "L&S Entrümpelung"],
        inLanguage: "de-DE",
        url: home,
        publisher: { "@id": id("business") },
      },
      {
        "@type": "HomeAndConstructionBusiness",
        "@id": id("business"),
        name: business.name,
        alternateName: brandName,
        description: homeDescription,
        url: home,
        logo: absolute("/icon.png"),
        image: absolute(shareImage.path),
        telephone: business.phone || undefined,
        email: business.email,
        founder: { "@type": "Person", name: business.owner },
        address: {
          "@type": "PostalAddress",
          streetAddress: address.street,
          postalCode: address.postalCode,
          addressLocality: address.city,
          addressRegion: "Bayern",
          addressCountry: "DE",
        },
        areaServed: [
          { "@type": "City", name: address.city },
          {
            "@type": "AdministrativeArea",
            name: "Landkreis Aichach-Friedberg",
          },
          { "@type": "City", name: "Augsburg" },
          { "@type": "Country", name: "Deutschland" },
        ],
        // Reachable around the clock (see the FAQ).
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "00:00",
          closes: "23:59",
        },
        knowsLanguage: "de",
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Leistungen",
          itemListElement: services.map((service) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: service.title,
              description: `${service.text} ${service.items.join(", ")}.`,
              areaServed: "DE",
            },
          })),
        },
      },
      {
        "@type": "FAQPage",
        "@id": id("faq"),
        mainEntity: faqs.map(([question, answer]) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };
}
