import { NextResponse } from "next/server"
import { headers } from "next/headers"

import { isProductionStudioHost } from "@/lib/seo/config"
import { isStudioHost } from "@/lib/platform/surface"
import { STUDIO_URL } from "@/lib/platform/urls"

export async function GET() {
  const host = (await headers()).get("host")
  const studio = isStudioHost(host)
  if (studio && !isProductionStudioHost(host)) {
    return new NextResponse("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }

  const sitemapUrl = studio
    ? `${STUDIO_URL}/sitemap.xml`
    : "https://www.jayantgoyal.com/sitemap.xml"
  const content = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /mfa-verify
Disallow: /reset-password
Disallow: /forgot-password
Content-Signal: search=yes, ai-train=no, ai-input=no

User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Amazonbot
Disallow: /

Sitemap: ${sitemapUrl}
`

  return new NextResponse(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
