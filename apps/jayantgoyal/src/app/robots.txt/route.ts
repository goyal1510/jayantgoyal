import { NextResponse } from "next/server"

export async function GET() {
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

Sitemap: https://www.jayantgoyal.com/sitemap.xml
`

  return new NextResponse(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
