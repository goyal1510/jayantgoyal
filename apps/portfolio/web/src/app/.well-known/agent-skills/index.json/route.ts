import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import {
  buildPortfolioAgentSkillsIndex,
  buildPortfolioDiscoverySkillMarkdown,
} from "@/lib/agent-discovery";

export function GET() {
  const skill = buildPortfolioDiscoverySkillMarkdown();
  const digestHex = createHash("sha256").update(skill).digest("hex");

  return NextResponse.json(buildPortfolioAgentSkillsIndex(digestHex), {
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
