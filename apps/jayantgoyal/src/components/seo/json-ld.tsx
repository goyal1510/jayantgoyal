import { LAST_SIGNIFICANT_UPDATE, PERSON_NAME, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo/config";

export function PersonJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: PERSON_NAME,
    givenName: "Jayant",
    familyName: "Goyal",
    url: SITE_URL,
    jobTitle: "Full-Stack Developer",
    image: `${SITE_URL}/assets/Jayant_favicon_io/android-chrome-512x512.png`,
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
      "Next.js", "React", "TypeScript", "Node.js", "Supabase",
      "Tailwind CSS", "Full-Stack Development", "PostgreSQL",
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function WebSiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    author: {
      "@type": "Person",
      name: PERSON_NAME,
      url: SITE_URL,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function ProfilePageJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: PERSON_NAME,
      givenName: "Jayant",
      familyName: "Goyal",
      url: SITE_URL,
      jobTitle: "Full-Stack Developer",
      image: `${SITE_URL}/assets/Jayant_favicon_io/android-chrome-512x512.png`,
      description: SITE_DESCRIPTION,
      sameAs: [
        "https://github.com/goyal1510",
        "https://www.linkedin.com/in/jayant-goyal-83b0b3228/",
      ],
      knowsAbout: [
        "Next.js", "React", "TypeScript", "Node.js", "Supabase",
        "Tailwind CSS", "PostgreSQL",
      ],
    },
    dateCreated: "2025-01-01T00:00:00+05:30",
    dateModified: LAST_SIGNIFICANT_UPDATE,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function SoftwareAppJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `Developer Tools | ${SITE_NAME}`,
    url: `${SITE_URL}/tools`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description: "A collection of 99+ free developer tools by Jayant, including UUID generator, JSON formatter, Base64 encoder, hash generators, regex tester, and more.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: PERSON_NAME,
      url: SITE_URL,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
