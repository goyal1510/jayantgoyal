"use client";

import { useEffect } from "react";

const PORTFOLIO_PAGES = [
  { path: "/", description: "Editorial home" },
  { path: "/about", description: "About, experience, and skills" },
  { path: "/work", description: "Work catalog" },
  { path: "/writing", description: "Writing index" },
  { path: "/resume", description: "Resume" },
  { path: "/contact", description: "Contact form" },
  { path: "/analytics", description: "Public traffic analytics" },
] as const;

type ModelContext = {
  registerTool?: (tool: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    execute: (input: Record<string, unknown>) => Promise<unknown>;
  }) => void;
  provideContext?: (context: { tools: unknown[] }) => void;
};

function modelContext(): ModelContext | undefined {
  return (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
}

/** Registers homepage navigation tools when the browser exposes WebMCP. */
export function PortfolioWebMcp() {
  useEffect(() => {
    const context = modelContext();
    if (!context) return;

    const tools = [
      {
        name: "list_portfolio_pages",
        description:
          "List the public Portfolio pages an agent can open for Jayant.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        execute: async () => PORTFOLIO_PAGES,
      },
      {
        name: "open_portfolio_page",
        description: "Navigate this browser tab to a public Portfolio path.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              enum: PORTFOLIO_PAGES.map((page) => page.path),
            },
          },
          required: ["path"],
          additionalProperties: false,
        },
        execute: async (input: Record<string, unknown>) => {
          const path = String(input.path ?? "");
          const allowed = PORTFOLIO_PAGES.some((page) => page.path === path);
          if (!allowed) return { error: "Unknown Portfolio path" };
          window.location.assign(path);
          return { ok: true, path };
        },
      },
    ];

    if (typeof context.registerTool === "function") {
      for (const tool of tools) context.registerTool(tool);
      return;
    }

    context.provideContext?.({ tools });
  }, []);

  return null;
}
