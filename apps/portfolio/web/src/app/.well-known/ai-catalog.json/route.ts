import { NextResponse } from "next/server";

import { buildPortfolioAiCatalog } from "@/lib/agent-discovery";

export function GET() {
  return NextResponse.json(buildPortfolioAiCatalog(), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
