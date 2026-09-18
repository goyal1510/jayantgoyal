import { APP_BRANDS, PERSON_BRAND } from "@jayantgoyal/web-brand";
import { applicationOrigin, applicationUrl } from "@jayantgoyal/web-urls";

const SITE_URL = applicationOrigin(
  "portfolio",
  process.env.NEXT_PUBLIC_SITE_URL,
);

const AUTH_ISSUER = "https://orwfvyditlguqvxvztkw.supabase.co/auth/v1";

export const AGENT_DISCOVERY_PATHS = {
  apiCatalog: "/.well-known/api-catalog",
  aiCatalog: "/.well-known/ai-catalog.json",
  oauthProtectedResource: "/.well-known/oauth-protected-resource",
  llms: "/llms.txt",
  authMd: "/auth.md",
} as const;

/** RFC 8288 Link values advertised on Portfolio HTML responses. */
export const PORTFOLIO_AGENT_LINK_HEADER = [
  `<${AGENT_DISCOVERY_PATHS.apiCatalog}>; rel="api-catalog"`,
  `<${AGENT_DISCOVERY_PATHS.llms}>; rel="describedby"; type="text/markdown"`,
  `<${AGENT_DISCOVERY_PATHS.aiCatalog}>; rel="describedby"; type="application/json"`,
  `<${AGENT_DISCOVERY_PATHS.authMd}>; rel="service-doc"`,
].join(", ");

export function estimateMarkdownTokens(content: string) {
  return Math.max(1, Math.round(content.length / 4));
}

export function buildPortfolioLlmsText() {
  const portfolio = APP_BRANDS.portfolio;

  return `# ${PERSON_BRAND.displayName} Portfolio

> ${portfolio.description}

## Public pages
- Home: ${portfolio.canonicalUrl}
- About: ${applicationUrl("portfolio", "/about")}
- Work: ${applicationUrl("portfolio", "/work")}
- Writing: ${applicationUrl("portfolio", "/writing")}
- Resume: ${applicationUrl("portfolio", "/resume")}
- Contact: ${applicationUrl("portfolio", "/contact")}
- Analytics: ${applicationUrl("portfolio", "/analytics")}

## Machine-readable discovery
- API catalog: ${applicationUrl("portfolio", AGENT_DISCOVERY_PATHS.apiCatalog)}
- Capability catalog: ${applicationUrl("portfolio", AGENT_DISCOVERY_PATHS.aiCatalog)}
- Agent auth notes: ${applicationUrl("portfolio", AGENT_DISCOVERY_PATHS.authMd)}

## Public JSON handlers
- Contact enquiry: POST ${applicationUrl("portfolio", "/api/contact")}
- GitHub contributions: GET ${applicationUrl("portfolio", "/api/github-contributions")}
- GitHub language totals: GET ${applicationUrl("portfolio", "/api/github-loc")}
- Resume PDF: GET ${applicationUrl("portfolio", "/api/resume")}

## Related products
- Studio: ${applicationUrl("studio")}
- Auth (human sign-in): ${applicationUrl("auth", "/welcome")}
- GitHub: https://github.com/goyal1510
`;
}

export function buildPortfolioApiCatalog() {
  return {
    linkset: [
      {
        anchor: SITE_URL,
        "api-catalog": [
          {
            href: `${SITE_URL}${AGENT_DISCOVERY_PATHS.apiCatalog}`,
            type: "application/linkset+json",
          },
        ],
        describedby: [
          {
            href: `${SITE_URL}${AGENT_DISCOVERY_PATHS.llms}`,
            type: "text/markdown",
          },
        ],
      },
      {
        anchor: `${SITE_URL}/api/contact`,
        "service-desc": [
          {
            href: `${SITE_URL}/api/contact`,
            type: "application/json",
          },
        ],
      },
      {
        anchor: `${SITE_URL}/api/github-contributions`,
        "service-desc": [
          {
            href: `${SITE_URL}/api/github-contributions`,
            type: "application/json",
          },
        ],
      },
      {
        anchor: `${SITE_URL}/api/github-loc`,
        "service-desc": [
          {
            href: `${SITE_URL}/api/github-loc`,
            type: "application/json",
          },
        ],
      },
      {
        anchor: `${SITE_URL}/api/resume`,
        "service-desc": [
          {
            href: `${SITE_URL}/api/resume`,
            type: "application/pdf",
          },
        ],
      },
    ],
  };
}

export function buildPortfolioAiCatalog() {
  const host = new URL(SITE_URL).hostname;

  return {
    specVersion: "1.0",
    host: {
      displayName: `${PERSON_BRAND.displayName} Portfolio`,
      identifier: `did:web:${host}`,
    },
    entries: [
      {
        identifier: `urn:air:${host}:docs:llms`,
        displayName: "Portfolio llms.txt",
        type: "text/markdown",
        url: `${SITE_URL}${AGENT_DISCOVERY_PATHS.llms}`,
        representativeQueries: [
          "who is Jayant",
          "what software does Jayant build",
          "where is the public resume",
        ],
      },
      {
        identifier: `urn:air:${host}:catalog:api`,
        displayName: "Portfolio API catalog",
        type: "application/linkset+json",
        url: `${SITE_URL}${AGENT_DISCOVERY_PATHS.apiCatalog}`,
        representativeQueries: [
          "how do I send Jayant a contact enquiry",
          "where are the public GitHub stats APIs",
        ],
      },
      {
        identifier: `urn:air:${host}:docs:auth`,
        displayName: "Portfolio auth.md",
        type: "text/markdown",
        url: `${SITE_URL}${AGENT_DISCOVERY_PATHS.authMd}`,
        representativeQueries: [
          "does jayantgoyal.com require OAuth",
          "where do humans sign in",
        ],
      },
    ],
  };
}

export function buildPortfolioProtectedResourceMetadata() {
  return {
    resource: SITE_URL,
    authorization_servers: [AUTH_ISSUER],
    scopes_supported: ["openid", "email"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${SITE_URL}${AGENT_DISCOVERY_PATHS.authMd}`,
  };
}

export function buildPortfolioAuthMarkdown() {
  return `# auth.md

This origin (${SITE_URL}) is Jayant's public editorial Portfolio. HTML pages
and the public JSON handlers listed in \`/.well-known/api-catalog\` do not
require agent registration or an access token.

Human account entry, recovery, MFA, and session security are owned by Auth at
${applicationUrl("auth", "/welcome")}. Tokens for Studio and Admin sessions are
issued by ${AUTH_ISSUER}.

There is no \`/agent/auth\` registration endpoint on this origin. Agents should
read \`/llms.txt\`, \`/.well-known/api-catalog\`, and
\`/.well-known/ai-catalog.json\` instead of creating credentials here.
`;
}

export function buildProductionRobotsText(siteUrl = SITE_URL) {
  return `User-agent: *
Allow: /
Disallow: /api/
Content-Signal: ai-train=no, search=yes, ai-input=yes

Agentmap: ${siteUrl}${AGENT_DISCOVERY_PATHS.aiCatalog}

Sitemap: ${siteUrl}/sitemap.xml
`;
}
