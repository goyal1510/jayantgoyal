import { NextResponse } from "next/server";

import { buildPortfolioAuthorizationServerMetadata } from "@/lib/agent-discovery";

export function GET() {
  return NextResponse.json(buildPortfolioAuthorizationServerMetadata(), {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
