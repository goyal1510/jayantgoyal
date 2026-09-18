import { NextResponse } from "next/server";

import { buildPortfolioMcpServerCard } from "@/lib/agent-discovery";

export function GET() {
  return NextResponse.json(buildPortfolioMcpServerCard(), {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
