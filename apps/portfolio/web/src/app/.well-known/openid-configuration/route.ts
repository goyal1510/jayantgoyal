import { NextResponse } from "next/server";

import { buildPortfolioOpenIdConfiguration } from "@/lib/agent-discovery";

export function GET() {
  return NextResponse.json(buildPortfolioOpenIdConfiguration(), {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
