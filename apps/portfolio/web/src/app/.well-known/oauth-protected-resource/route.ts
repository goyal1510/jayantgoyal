import { NextResponse } from "next/server";

import { buildPortfolioProtectedResourceMetadata } from "@/lib/agent-discovery";

export function GET() {
  return NextResponse.json(buildPortfolioProtectedResourceMetadata(), {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
