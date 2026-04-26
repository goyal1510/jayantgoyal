import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    serverInfo: {
      name: "jayantgoyal.com",
      version: "1.0.0",
    },
    description:
      "Developer platform with 99+ tools, portfolio, games, and productivity apps",
    url: "https://www.jayantgoyal.com",
    capabilities: {
      tools: true,
      resources: true,
    },
  })
}
