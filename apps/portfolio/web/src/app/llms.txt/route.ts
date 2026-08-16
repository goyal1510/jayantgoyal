import { NextResponse } from "next/server";

import { APP_BRANDS, PERSON_BRAND } from "@jayantgoyal/web-brand";
import { applicationUrl } from "@jayantgoyal/web-urls";

export function GET() {
  const portfolio = APP_BRANDS.portfolio;
  const content = `# ${PERSON_BRAND.displayName} Portfolio

> ${portfolio.description}

## Portfolio
- Home: ${portfolio.canonicalUrl}
- Writing: ${applicationUrl("portfolio", "/writing")}
- Resume: ${applicationUrl("portfolio", "/resume")}
- GitHub: https://github.com/goyal1510

## Studio
- Studio: ${applicationUrl("studio")}
- Developer tools, games, productivity applications, and account-backed workspaces are owned by Studio.
`;

  return new NextResponse(content, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
