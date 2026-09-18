import { describe, expect, it } from "vitest";

import {
  AGENT_DISCOVERY_PATHS,
  PORTFOLIO_AGENT_LINK_HEADER,
  buildPortfolioA2aAgentCard,
  buildPortfolioAgentSkillsIndex,
  buildPortfolioAiCatalog,
  buildPortfolioApiCatalog,
  buildPortfolioAuthMarkdown,
  buildPortfolioLlmsText,
  buildPortfolioMcpServerCard,
  buildPortfolioAuthorizationServerMetadata,
  buildPortfolioProtectedResourceMetadata,
  buildProductionRobotsText,
  estimateMarkdownTokens,
} from "./agent-discovery";

describe("Portfolio agent discovery documents", () => {
  it("advertises registered Link relations for catalogs and docs", () => {
    expect(PORTFOLIO_AGENT_LINK_HEADER).toContain('rel="api-catalog"');
    expect(PORTFOLIO_AGENT_LINK_HEADER).toContain(
      AGENT_DISCOVERY_PATHS.apiCatalog,
    );
    expect(PORTFOLIO_AGENT_LINK_HEADER).toContain('rel="describedby"');
    expect(PORTFOLIO_AGENT_LINK_HEADER).toContain('rel="service-doc"');
  });

  it("keeps the ARD catalog to url-backed public documents", () => {
    const catalog = buildPortfolioAiCatalog();

    expect(catalog.specVersion).toBe("1.0");
    expect(catalog.entries.length).toBeGreaterThan(0);
    for (const entry of catalog.entries) {
      expect(entry.identifier.startsWith("urn:air:")).toBe(true);
      expect("url" in entry).toBe(true);
      expect("data" in entry).toBe(false);
      expect(entry.representativeQueries.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("declares Content Signals and an Agentmap without inventing training rights", () => {
    const robots = buildProductionRobotsText("https://jayantgoyal.com");

    expect(robots).toContain(
      "Content-Signal: ai-train=no, search=yes, ai-input=yes",
    );
    expect(robots).toContain(
      "Agentmap: https://jayantgoyal.com/.well-known/ai-catalog.json",
    );
  });

  it("hosts authorization-server metadata with an anonymous agent_auth block", () => {
    const as = buildPortfolioAuthorizationServerMetadata();
    const prm = buildPortfolioProtectedResourceMetadata();

    expect(prm.authorization_servers).toEqual([
      as.issuer,
    ]);
    expect(as.agent_auth.skill).toContain("/auth.md");
    expect(as.agent_auth.register_uri).toContain("/agent/identity");
    expect(as.agent_auth.identity_types_supported).toEqual(["anonymous"]);
    expect(as.authorization_endpoint).toContain("/authorize");
    expect(as.jwks_uri).toContain("jwks.json");
  });

  it("keeps auth.md titled for Auth.md discovery", () => {
    const markdown = buildPortfolioAuthMarkdown();

    expect(markdown.startsWith("# auth.md")).toBe(true);
    expect(markdown).toContain("agent_auth");
    expect(buildPortfolioProtectedResourceMetadata().bearer_methods_supported).toEqual(
      ["header"],
    );
  });

  it("counts markdown tokens from the llms.txt body", () => {
    const body = buildPortfolioLlmsText();
    expect(body).toContain("/api/contact");
    expect(estimateMarkdownTokens(body)).toBeGreaterThan(10);
    expect(buildPortfolioApiCatalog().linkset.length).toBeGreaterThan(1);
  });

  it("publishes an MCP card and a hashed skill-md index", () => {
    const card = buildPortfolioMcpServerCard();
    const index = buildPortfolioAgentSkillsIndex("abc");

    expect(card.serverInfo.name).toContain("portfolio");
    expect(card.endpoint).toContain("/llms.txt");
    expect(index.$schema).toContain("0.2.0");
    expect(index.skills[0]?.type).toBe("skill-md");
    expect(index.skills[0]?.digest).toBe("sha256:abc");
  });

  it("publishes an A2A agent card for public Portfolio skills", () => {
    const card = buildPortfolioA2aAgentCard();

    expect(card.name).toContain("Portfolio");
    expect(card.version).toBe("1.0.0");
    expect(card.supportedInterfaces[0]?.url).toBeTruthy();
    expect(card.supportedInterfaces[0]?.transport).toBe("HTTP+JSON");
    expect(card.capabilities.streaming).toBe(false);
    expect(card.skills.every((skill) => skill.id && skill.name && skill.description)).toBe(
      true,
    );
  });
});
