import { NextResponse } from "next/server";

import { SITE_URL } from "@/lib/seo/config";
import { buildProductionRobotsText } from "@/lib/agent-discovery";

export function GET() {
  const body =
    process.env.VERCEL_ENV === "preview"
      ? "User-agent: *\nDisallow: /\n"
      : buildProductionRobotsText(SITE_URL);

  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
