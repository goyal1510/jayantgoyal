import { PERSON_BRAND } from "@jayantgoyal/web-brand";

import {
  PERSON_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/config";
import { allTools } from "@/lib/tools/tools";

export function WebSiteJsonLd({
  siteUrl = SITE_URL,
  siteName = SITE_NAME,
  description = SITE_DESCRIPTION,
}: {
  siteUrl?: string;
  siteName?: string;
  description?: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description,
    author: {
      "@type": "Person",
      name: PERSON_NAME,
      url: PERSON_BRAND.canonicalUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function SoftwareAppJsonLd({
  siteUrl = SITE_URL,
}: {
  siteUrl?: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `Developer Tools | ${SITE_NAME}`,
    url: `${siteUrl}/tools`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description: `A collection of ${allTools.length} free developer tools by ${PERSON_NAME}, including UUID generation, JSON formatting, Base64 encoding, hashing, regex testing, converters, and more.`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: PERSON_NAME,
      url: PERSON_BRAND.canonicalUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
