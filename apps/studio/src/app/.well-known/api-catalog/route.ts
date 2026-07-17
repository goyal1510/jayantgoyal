import { NextResponse } from "next/server"

import { PORTFOLIO_URL } from "@/lib/platform/urls"
import { SITE_URL } from "@/lib/seo/config"

export async function GET() {
  return NextResponse.json(
    {
      linkset: [
        {
          anchor: SITE_URL,
          "service-desc": [
            {
              href: `${SITE_URL}/.well-known/api-catalog`,
              type: "application/linkset+json",
            },
          ],
        },
        {
          anchor: `${PORTFOLIO_URL}/api/contact`,
          "service-desc": [
            {
              href: `${PORTFOLIO_URL}/api/contact`,
              type: "application/json",
            },
          ],
        },
        {
          anchor: `${SITE_URL}/api/github-loc`,
          "service-desc": [
            {
              href: `${SITE_URL}/api/github-loc`,
              type: "application/json",
            },
          ],
        },
      ],
    },
    {
      headers: { "Content-Type": "application/linkset+json" },
    },
  )
}
