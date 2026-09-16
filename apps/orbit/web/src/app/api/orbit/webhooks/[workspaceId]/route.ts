import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ workspaceId: string }>;
};

/** Accepts signed incoming webhook events for a workspace (P2 integration hook). */
export async function POST(request: Request, context: RouteContext) {
  const { workspaceId } = await context.params;
  const signature = request.headers.get("x-orbit-signature");
  const timestamp = request.headers.get("x-orbit-timestamp");
  const rawBody = await request.text();

  if (!signature || !timestamp) {
    return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
  }

  const secret = process.env.ORBIT_INBOUND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Inbound webhooks are not configured" }, { status: 503 });
  }

  const payload = `${timestamp}.${rawBody}`;
  const expected = createHash("sha256").update(`${secret}:${payload}`).digest("hex");
  const provided = signature.replace(/^sha256=/, "");

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    workspaceId,
    received: body,
  });
}
