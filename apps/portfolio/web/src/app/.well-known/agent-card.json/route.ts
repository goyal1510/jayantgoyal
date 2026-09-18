import { NextResponse } from "next/server";

import { buildPortfolioA2aAgentCard } from "@/lib/agent-discovery";

export function GET() {
  return NextResponse.json(buildPortfolioA2aAgentCard(), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
