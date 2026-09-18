import { type NextRequest, NextResponse } from "next/server";

import {
  buildPortfolioLlmsText,
  estimateMarkdownTokens,
} from "@/lib/agent-discovery";

export function GET(request: NextRequest) {
  const body = buildPortfolioLlmsText();
  const wantsMarkdown = request.headers.get("accept")?.includes("text/markdown");
  const headers = new Headers({
    "Content-Type": wantsMarkdown
      ? "text/markdown; charset=utf-8"
      : "text/plain; charset=utf-8",
  });

  if (wantsMarkdown) {
    headers.set("x-markdown-tokens", String(estimateMarkdownTokens(body)));
  }

  return new NextResponse(body, { headers });
}
