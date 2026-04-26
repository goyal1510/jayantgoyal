import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    name: "jayantgoyal.com",
    description:
      "Developer platform with 99+ tools, portfolio, games, and productivity apps",
    url: "https://www.jayantgoyal.com",
    version: "1.0.0",
    capabilities: {
      tools: true,
      resources: true,
    },
  })
}
