import { NextRequest, NextResponse } from "next/server";

import { deliverContactSubmission } from "@/lib/contact/server";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1_000;
const RATE_LIMIT_MAX = 5;
const rateLimitByIp = new Map<string, { count: number; resetAt: number }>();

function canSubmit(ip: string) {
  const now = Date.now();
  const entry = rateLimitByIp.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitByIp.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!canSubmit(ip)) {
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
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = await deliverContactSubmission(
    body as Record<string, unknown>,
  );
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    { success: true, messageId: result.messageId },
    { status: 200 },
  );
}
