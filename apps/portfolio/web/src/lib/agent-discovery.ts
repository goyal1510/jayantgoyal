import { APP_BRANDS, PERSON_BRAND } from "@jayantgoyal/web-brand";
import { applicationOrigin, applicationUrl } from "@jayantgoyal/web-urls";

const SITE_URL = applicationOrigin(
  "portfolio",
  process.env.NEXT_PUBLIC_SITE_URL,
);

export const AUTH_ISSUER =
  "https://orwfvyditlguqvxvztkw.supabase.co/auth/v1";

export const AGENT_DISCOVERY_PATHS = {
  apiCatalog: "/.well-known/api-catalog",
  aiCatalog: "/.well-known/ai-catalog.json",
  oauthProtectedResource: "/.well-known/oauth-protected-resource",
  oauthAuthorizationServer: "/.well-known/oauth-authorization-server",
  openidConfiguration: "/.well-known/openid-configuration",
  mcpServerCard: "/.well-known/mcp/server-card.json",
  a2aAgentCard: "/.well-known/agent-card.json",
  agentSkillsIndex: "/.well-known/agent-skills/index.json",
  agentSkill: "/.well-known/agent-skills/portfolio-discovery/SKILL.md",
  llms: "/llms.txt",
  authMd: "/auth.md",
  agentIdentity: "/agent/identity",
  agentClaim: "/agent/identity/claim",
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
    authorization_servers: [SITE_URL],
    scopes_supported: ["openid", "email"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${SITE_URL}${AGENT_DISCOVERY_PATHS.authMd}`,
  };
}

export function buildPortfolioAuthorizationServerMetadata() {
  return {
    issuer: SITE_URL,
    authorization_endpoint: `${AUTH_ISSUER}/authorize`,
    token_endpoint: `${AUTH_ISSUER}/token`,
    jwks_uri: `${AUTH_ISSUER}/.well-known/jwks.json`,
    grant_types_supported: ["authorization_code", "refresh_token"],
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    scopes_supported: ["openid", "email", "profile"],
    revocation_endpoint: `${AUTH_ISSUER}/logout`,
    agent_auth: {
      skill: `${SITE_URL}${AGENT_DISCOVERY_PATHS.authMd}`,
      register_uri: `${SITE_URL}${AGENT_DISCOVERY_PATHS.agentIdentity}`,
      identity_endpoint: `${SITE_URL}${AGENT_DISCOVERY_PATHS.agentIdentity}`,
      claim_uri: `${SITE_URL}${AGENT_DISCOVERY_PATHS.agentClaim}`,
      claim_endpoint: `${SITE_URL}${AGENT_DISCOVERY_PATHS.agentClaim}`,
      identity_types_supported: ["anonymous"],
      anonymous: {
        credential_types_supported: ["none"],
        claim_uri: `${SITE_URL}${AGENT_DISCOVERY_PATHS.agentClaim}`,
      },
    },
  };
}

export function buildPortfolioOpenIdConfiguration() {
  const as = buildPortfolioAuthorizationServerMetadata();
  return {
    issuer: as.issuer,
    authorization_endpoint: as.authorization_endpoint,
    token_endpoint: as.token_endpoint,
    jwks_uri: as.jwks_uri,
    grant_types_supported: as.grant_types_supported,
    response_types_supported: as.response_types_supported,
    subject_types_supported: as.subject_types_supported,
    scopes_supported: as.scopes_supported,
  };
}

export function buildPortfolioMcpServerCard() {
  return {
    serverInfo: {
      name: `${new URL(SITE_URL).hostname}-portfolio`,
      version: "1.0.0",
    },
    transport: {
      type: "streamable-http",
      endpoint: `${SITE_URL}${AGENT_DISCOVERY_PATHS.llms}`,
    },
    endpoint: `${SITE_URL}${AGENT_DISCOVERY_PATHS.llms}`,
    capabilities: {
      tools: false,
      resources: true,
      prompts: false,
    },
  };
}

export function buildPortfolioA2aAgentCard() {
  const skillModes = {
    inputModes: ["text/plain", "application/json"],
    outputModes: ["text/markdown", "application/json"],
  };

  return {
    name: `${PERSON_BRAND.displayName} Portfolio`,
    version: "1.0.0",
    description: APP_BRANDS.portfolio.description,
    documentationUrl: `${SITE_URL}${AGENT_DISCOVERY_PATHS.llms}`,
    provider: {
      organization: PERSON_BRAND.displayName,
      url: SITE_URL,
    },
    supportedInterfaces: [
      {
        url: SITE_URL,
        protocolBinding: "HTTP+JSON",
        protocolVersion: "0.3",
        transport: "HTTP+JSON",
      },
    ],
    capabilities: {
      streaming: false,
      pushNotifications: false,
      extendedAgentCard: false,
    },
    defaultInputModes: skillModes.inputModes,
    defaultOutputModes: skillModes.outputModes,
    skills: [
      {
        id: "read-portfolio",
        name: "Read Portfolio",
        description:
          "Read public editorial pages and discovery documents for Jayant's software work.",
        tags: ["portfolio", "discovery", "editorial"],
        examples: ["Who is Jayant?", "What products has Jayant shipped?"],
        ...skillModes,
      },
      {
        id: "contact-enquiry",
        name: "Contact enquiry",
        description:
          "Send a public contact enquiry through POST /api/contact. No agent credential is required.",
        tags: ["contact", "email"],
        examples: ["How do I send Jayant a short product note?"],
        ...skillModes,
      },
    ],
  };
}

export function buildPortfolioDiscoverySkillMarkdown() {
  return `---
name: portfolio-discovery
description: Read Jayant's public Portfolio discovery documents and pages.
---

# Portfolio discovery

Use the public documents on ${SITE_URL}:

1. Read \`${AGENT_DISCOVERY_PATHS.llms}\` for the product map.
2. Read \`${AGENT_DISCOVERY_PATHS.apiCatalog}\` for public JSON handlers.
3. Read \`${AGENT_DISCOVERY_PATHS.aiCatalog}\` for the capability catalog.
4. Do not register an agent credential. Public pages do not require a token.
`;
}

export function buildPortfolioAgentSkillsIndex(digestHex: string) {
  return {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: "portfolio-discovery",
        type: "skill-md",
        description:
          "Instructions for reading Jayant's public Portfolio pages and discovery documents.",
        url: `${SITE_URL}${AGENT_DISCOVERY_PATHS.agentSkill}`,
        digest: `sha256:${digestHex}`,
      },
    ],
  };
}

export function buildAnonymousIdentityResponse() {
  return {
    error: "public_resource",
    error_description:
      "This origin does not issue agent credentials. Public Portfolio pages and JSON handlers do not require a token.",
  };
}

export function buildPortfolioAuthMarkdown() {
  return `# auth.md

This origin (${SITE_URL}) is Jayant's public editorial Portfolio. HTML pages
and the public JSON handlers listed in \`/.well-known/api-catalog\` do not
require an access token.

## Discovery

1. Fetch \`${AGENT_DISCOVERY_PATHS.oauthProtectedResource}\`.
2. Fetch \`${AGENT_DISCOVERY_PATHS.oauthAuthorizationServer}\` and read \`agent_auth\`.
3. \`agent_auth.register_uri\` is \`${AGENT_DISCOVERY_PATHS.agentIdentity}\`.

## Registration

\`POST ${AGENT_DISCOVERY_PATHS.agentIdentity}\` with \`{"type":"anonymous"}\` returns
\`public_resource\`. No credential is issued. Human sign-in stays at
${applicationUrl("auth", "/welcome")}.

Studio and Admin session tokens are issued by ${AUTH_ISSUER}.
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
