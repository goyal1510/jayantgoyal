import { NextResponse } from "next/server";

import { buildAnonymousIdentityResponse } from "@/lib/agent-discovery";

const headers = { "Access-Control-Allow-Origin": "*" };

export function GET() {
  return NextResponse.json(buildAnonymousIdentityResponse(), { headers });
}

export function POST() {
  return NextResponse.json(buildAnonymousIdentityResponse(), { headers });
}
