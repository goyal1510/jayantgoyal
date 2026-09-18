import { NextResponse } from "next/server";

import { buildPortfolioApiCatalog } from "@/lib/agent-discovery";

export function GET() {
  return NextResponse.json(buildPortfolioApiCatalog(), {
    headers: {
      "Content-Type": "application/linkset+json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
