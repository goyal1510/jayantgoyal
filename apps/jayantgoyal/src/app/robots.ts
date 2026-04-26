import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/mfa-verify", "/reset-password", "/forgot-password"],
    },
    sitemap: "https://www.jayantgoyal.com/sitemap.xml",
  }
}
