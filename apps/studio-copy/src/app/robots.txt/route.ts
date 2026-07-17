import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { isProductionStudioHost, SITE_URL } from "@/lib/seo/config";

export async function GET() {
  if (!isProductionStudioHost((await headers()).get("host"))) {
    return new NextResponse("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

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

Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new NextResponse(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
