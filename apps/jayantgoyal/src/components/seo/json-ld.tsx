export function PersonJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Jayant Goyal",
    url: "https://www.jayantgoyal.com",
    jobTitle: "Full-Stack Developer",
    sameAs: [
      "https://github.com/goyal1510",
      "https://www.linkedin.com/in/jayant-goyal-83b0b3228/",
    ],
    knowsAbout: [
      "Next.js", "React", "TypeScript", "Node.js", "Supabase",
      "Tailwind CSS", "Full-Stack Development",
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
