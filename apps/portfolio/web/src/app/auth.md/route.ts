import { NextResponse } from "next/server";

import { buildPortfolioAuthMarkdown } from "@/lib/agent-discovery";

export function GET() {
  return new NextResponse(buildPortfolioAuthMarkdown(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
