import { NextResponse } from "next/server"

import { SITE_URL } from "@/lib/seo/config"

export async function GET() {
  return NextResponse.json({
    serverInfo: {
      name: "studio.jayantgoyal.com",
      version: "1.0.0",
    },
    description:
      "Product studio with 99+ developer tools, games, and productivity apps",
    url: SITE_URL,
    capabilities: {
      tools: true,
      resources: true,
    },
  })
}
