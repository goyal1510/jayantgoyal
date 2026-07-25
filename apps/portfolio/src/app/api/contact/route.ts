import { NextRequest, NextResponse } from "next/server";

import { createContactRateLimitKey } from "@/lib/contact/rate-limit";
import { deliverContactSubmission } from "@/lib/contact/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function consumeContactRateLimit(request: NextRequest) {
  const secret = process.env.CONTACT_RATE_LIMIT_SECRET;
  if (!secret) {
    console.error("CONTACT_RATE_LIMIT_SECRET is not configured");
    return { configured: false as const, allowed: false };
  }

  let keyHash: string;
  try {
    keyHash = createContactRateLimitKey(getClientIp(request), secret);
  } catch (error) {
    console.error(
      "Invalid contact rate-limit configuration",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { configured: false as const, allowed: false };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("portfolio")
    .rpc("consume_contact_rate_limit", { p_key_hash: keyHash });

  if (error || typeof data !== "boolean") {
    console.error(
      "Unable to enforce contact rate limit",
      error?.message ?? "Unexpected response",
    );
    return { configured: true as const, allowed: false, unavailable: true };
  }

  return { configured: true as const, allowed: data };
}

export async function POST(request: NextRequest) {
  const rateLimit = await consumeContactRateLimit(request);
  if (!rateLimit.configured || "unavailable" in rateLimit) {
    return NextResponse.json(
      { error: "Contact service is temporarily unavailable." },
      { status: 503 },
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const result = await deliverContactSubmission(
    body as Record<string, unknown>,
  );
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(
    { success: true, messageId: result.messageId },
    { status: 200 },
  );
}
