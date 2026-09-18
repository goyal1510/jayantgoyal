import { NextResponse } from "next/server";

import { buildPortfolioDiscoverySkillMarkdown } from "@/lib/agent-discovery";

export function GET() {
  return new NextResponse(buildPortfolioDiscoverySkillMarkdown(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
