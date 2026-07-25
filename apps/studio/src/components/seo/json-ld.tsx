import { BRAND_ASSET_PATHS, PERSON_BRAND } from "@repo/brand";

import {
  LAST_SIGNIFICANT_UPDATE,
  PERSON_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/config";
import { allTools } from "@/lib/tools/tools";

export function PersonJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PERSON_NAME,
    givenName: PERSON_BRAND.givenName,
    url: SITE_URL,
    jobTitle: "Software Engineer",
    image: `${SITE_URL}${BRAND_ASSET_PATHS.android512}`,
    email: "goyal151002@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hyderabad",
      addressCountry: "IN",
    },
    sameAs: [
      "https://github.com/goyal1510",
      "https://www.linkedin.com/in/jayant-goyal-83b0b3228/",
    ],
    knowsAbout: [
      "Next.js",
      "React",
      "TypeScript",
      "Node.js",
      "Supabase",
      "Tailwind CSS",
      "Full-Stack Development",
      "PostgreSQL",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

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
      url: siteUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function ProfilePageJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: PERSON_NAME,
      givenName: PERSON_BRAND.givenName,
      url: SITE_URL,
      jobTitle: "Software Engineer",
      image: `${SITE_URL}${BRAND_ASSET_PATHS.android512}`,
      description: SITE_DESCRIPTION,
      sameAs: [
        "https://github.com/goyal1510",
        "https://www.linkedin.com/in/jayant-goyal-83b0b3228/",
      ],
      knowsAbout: [
        "Next.js",
        "React",
        "TypeScript",
        "Node.js",
        "Supabase",
        "Tailwind CSS",
        "PostgreSQL",
      ],
    },
    dateCreated: "2025-01-01T00:00:00+05:30",
    dateModified: LAST_SIGNIFICANT_UPDATE,
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
    description: `A collection of ${allTools.length} free developer tools by Jayant, including UUID generation, JSON formatting, Base64 encoding, hashing, regex testing, converters, and more.`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: PERSON_NAME,
      url: siteUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
