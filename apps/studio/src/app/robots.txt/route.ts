import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { isProductionStudioHost, SITE_URL } from "@/lib/seo/config";

export function buildProductionRobotsContent(siteUrl = SITE_URL) {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /mfa-verify
Disallow: /reset-password
Disallow: /forgot-password

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

Sitemap: ${siteUrl}/sitemap.xml
`;
}

export async function GET() {
  if (!isProductionStudioHost((await headers()).get("host"))) {
    return new NextResponse("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse(buildProductionRobotsContent(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
