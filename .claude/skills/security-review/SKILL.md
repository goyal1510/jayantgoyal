---
name: security-review
description: Auto-review code for security vulnerabilities. Use when modifying auth flows, API routes, database queries, or user input handling.
disable-model-invocation: false
user-invocable: false
---

# Security Review

When code changes touch auth, API routes, database queries, or user input handling, check for:

## Critical
- SQL injection via raw queries or unparameterized inputs
- XSS via unsanitized user content in JSX (especially `dangerouslySetInnerHTML`)
- Exposed secrets or API keys in client-side code
- Missing auth checks on API routes
- RLS policy bypasses

## Warning
- Missing input validation on API route handlers
- Missing CSRF protection on state-changing endpoints
- Overly permissive CORS headers
- Sensitive data in URL query params or logs

## Info
- Supabase service role key usage (should only be in server-side code)
- Missing rate limiting on public endpoints
- Missing error sanitization (don't leak internal errors to client)
