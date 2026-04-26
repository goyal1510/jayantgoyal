export function PersonJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Jayant Goyal",
    url: "https://www.jayantgoyal.com",
    jobTitle: "Full-Stack Developer",
    image: "https://www.jayantgoyal.com/assets/Jayant_favicon_io/android-chrome-512x512.png",
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
    name: "Jayant Goyal",
    url: "https://www.jayantgoyal.com",
    description: "Full-stack developer portfolio with 99+ dev tools, games, and utilities.",
    author: {
      "@type": "Person",
      name: "Jayant Goyal",
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
      name: "Jayant Goyal",
      url: "https://www.jayantgoyal.com",
      jobTitle: "Full-Stack Developer",
      image: "https://www.jayantgoyal.com/assets/Jayant_favicon_io/android-chrome-512x512.png",
      description: "Full-stack developer skilled in Next.js, React, TypeScript, and Supabase. Building innovative web applications.",
      sameAs: [
        "https://github.com/goyal1510",
        "https://www.linkedin.com/in/jayant-goyal-83b0b3228/",
      ],
      knowsAbout: [
        "Next.js", "React", "TypeScript", "Node.js", "Supabase",
        "Tailwind CSS", "PostgreSQL",
      ],
    },
    dateCreated: "2025-01-01",
    dateModified: new Date().toISOString().split("T")[0],
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
    name: "Jayant Goyal Dev Tools",
    url: "https://www.jayantgoyal.com/tools",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description: "A collection of 99+ free developer tools including UUID generator, JSON formatter, Base64 encoder, hash generators, regex tester, and more.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "Jayant Goyal",
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
