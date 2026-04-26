# Agent Readiness Files

**Date:** 2026-04-26
**Area:** apps/jayantgoyal

## Problem
Add agent/AI discovery files so crawlers and AI agents can understand what the site offers.

## Solution
Created 5 new files and updated the proxy:

1. **`public/llms.txt`** - Plain text file describing the site for LLMs
2. **`src/app/.well-known/api-catalog/route.ts`** - RFC 9727 API catalog (application/linkset+json)
3. **`src/app/.well-known/oauth-protected-resource/route.ts`** - RFC 9728 OAuth metadata
4. **`src/app/.well-known/mcp.json/route.ts`** - MCP Server Card for agent discovery
5. **`src/app/.well-known/agent-skills/index.json/route.ts`** - Cloudflare Agent Skills Discovery v0.2.0

Updated `src/proxy.ts` to add `/.well-known/` and `/llms.txt` to `ZERO_COST_PATHS` so these endpoints skip auth entirely.
