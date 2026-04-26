# 2026-04-26 — Agent Readiness Fixes

## Area
Main app (`apps/jayantgoyal`) — agent/AI discovery infrastructure

## Problem
Several agent readiness issues remain:
1. No markdown content negotiation (Accept: text/markdown)
2. robots.txt missing Content-Signal directive
3. Missing OpenID Configuration discovery endpoint
4. MCP server card missing `serverInfo` wrapper

## Changes

### 1. Markdown negotiation in proxy.ts
- Added check at top of proxy for `Accept: text/markdown` header
- Rewrites to `/llms.txt` with proper content type

### 2. robots.txt → route handler
- Deleted `src/app/robots.ts` (Next.js metadata API)
- Created `src/app/robots.txt/route.ts` (route handler for raw text with Content-Signal)

### 3. OpenID Configuration
- Created `src/app/.well-known/openid-configuration/route.ts`
- Points to Supabase auth endpoints

### 4. MCP server card fix
- Updated `src/app/.well-known/mcp.json/route.ts` to wrap name in `serverInfo` object per MCP spec
