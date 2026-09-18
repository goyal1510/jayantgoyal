import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      error: "claim_not_enabled",
      error_description:
        "This origin does not run an agent claim ceremony. Public pages do not require a token.",
    },
    { status: 404, headers: { "Access-Control-Allow-Origin": "*" } },
  );
}

export function POST() {
  return GET();
}
