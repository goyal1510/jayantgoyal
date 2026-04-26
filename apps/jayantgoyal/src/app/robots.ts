import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/mfa-verify", "/reset-password", "/forgot-password"],
      },
      // Block AI training crawlers (replaces Cloudflare Content-Signal)
      {
        userAgent: ["GPTBot", "ClaudeBot", "CCBot", "Google-Extended", "Bytespider", "Amazonbot"],
        disallow: "/",
      },
    ],
    sitemap: "https://www.jayantgoyal.com/sitemap.xml",
  }
}
