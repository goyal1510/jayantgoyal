import { NextResponse } from "next/server";

import { APP_BRANDS, PERSON_BRAND } from "@jayantgoyal/web-brand";
import { applicationUrl } from "@jayantgoyal/web-urls";

import { GAME_META } from "@/lib/games/config";
import { allTools } from "@/lib/tools/tools";

export function GET() {
  const studio = APP_BRANDS.studio;
  const games = Object.values(GAME_META).map(({ name }) => name);
  const content = `# ${studio.publicName}

> ${studio.description}

## Features
- Developer Tools: ${allTools.length} utilities for generation, conversion, formatting, validation, and inspection
- Games: ${games.length} games (${games.join(", ")})
- Account-backed workspaces: File Manager, Sync Scratchpad, Activity Tracker, and Calculator
- Public products: Weather, Calculator Builder, GitHub Stats, and the developer-tools catalog

## Links
- Studio: ${studio.canonicalUrl}
- Products: ${applicationUrl("studio", "/products")}
- Tools: ${applicationUrl("studio", "/tools")}
- Portfolio: ${PERSON_BRAND.canonicalUrl}
- GitHub: https://github.com/goyal1510
`;

  return new NextResponse(content, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
