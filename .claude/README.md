# .claude Configuration

This directory configures [Claude Code](https://claude.ai/code) for the jayantgoyal monorepo. It defines slash commands, AI agents, auto-invoked skills, rules, and permissions.

## Directory Structure

```
.claude/
├── README.md                 # This file
├── settings.json             # Shared permissions (checked in)
├── settings.local.json       # Local permissions allowlist (gitignored)
├── commands/                 # Slash commands (manually invoked)
│   ├── fix-issue.md
│   ├── review.md
│   └── ship.md
├── agents/                   # Specialized AI agents (manually invoked)
│   ├── code-reviewer.md
│   └── security-auditor.md
├── rules/                    # Always-on context rules (auto-loaded)
│   ├── code-style.md
│   ├── auth.md
│   └── database.md
└── skills/
    └── security-review/
        └── SKILL.md          # Auto-invoked security checks
```

---

## Commands

Commands are custom workflows invoked manually with `/command-name` in a Claude Code session.

### `/fix-issue <number>`

Fixes a GitHub issue end-to-end.

**Usage:**

```
/fix-issue 42
```

**Workflow:**

1. Switches GitHub CLI auth to `goyal1510`
2. Fetches issue details via `gh issue view`
3. Explores the codebase to locate the root cause
4. Implements the fix following CLAUDE.md conventions
5. Runs `pnpm check-types --filter jg` and `pnpm lint` to verify
6. Summarizes what was changed and why

---

### `/review`

Reviews all uncommitted changes for issues before shipping.

**Usage:**

```
/review
```

**Workflow:**

1. Runs `git diff` to see all changes
2. Reviews each changed file for:
   - Security vulnerabilities (XSS, injection, exposed secrets)
   - TypeScript type safety issues
   - Missing error handling
   - Breaking changes to existing functionality
   - Performance concerns (unnecessary re-renders, missing memoization)
3. Checks adherence to project conventions:
   - Server component wraps client component pattern
   - `cn()` for class merging
   - Sonner toasts for notifications
   - `<PageSpinner />` for loading states
   - Plain `<img>` for external URLs (not `next/image`)
4. Runs `pnpm check-types --filter jg` and `pnpm lint`
5. Provides a summary grouped by severity: **critical**, **warning**, **suggestion**

---

### `/ship`

Commits and pushes current changes to the main branch.

**Usage:**

```
/ship
```

**Workflow:**

1. Shows all modified and untracked files (`git status`)
2. Reviews staged and unstaged changes (`git diff`)
3. Checks recent commit messages to match existing style (`git log --oneline -5`)
4. Stages only relevant files by name (never `git add -A` or `git add .`)
5. Writes a concise commit message summarizing the "why" not the "what"
6. Commits under the user's name (no Co-Authored-By lines)
7. Pushes to `origin main`
8. Confirms success with the commit hash

**Safety rules:**

- Never commits files containing secrets (`.env`, credentials, etc.)
- If there are no changes, stops and reports that
- Always shows what will be committed before committing
- Uses a HEREDOC for the commit message to preserve formatting

---

## Agents

Agents are specialized AI personas that focus Claude's expertise on specific tasks. Invoke them by referencing their name in conversation (e.g., "use the code-reviewer agent" or "@code-reviewer").

### `code-reviewer`

A senior code reviewer tuned for the Next.js 16 + Supabase + Turborepo stack.

**Focus areas:**

| Area | What it checks |
|------|---------------|
| Type safety | `any` types, missing return types on exported functions |
| React patterns | Missing dependency arrays, stale closures, unnecessary re-renders |
| Next.js conventions | Server vs client components, `cache()` usage, metadata exports |
| Supabase | Error handling, correct schema usage, no service role key leaks |
| Accessibility | Missing `aria-` attributes, keyboard navigation, color contrast |

**Output style:**

- One line per finding, grouped by file
- Severity labels: `[critical]`, `[warning]`, `[suggestion]`
- Always suggests a fix, not just the problem

---

### `security-auditor`

A security auditor specializing in Next.js + Supabase applications.

**Audit scope:**

- Auth flows (login, signup, guest login, MFA, password reset)
- API route handlers (`src/app/api/`)
- Proxy/middleware (`src/proxy.ts`)
- Database queries and RLS policies
- Client-side data handling and storage

**Methodology:**

1. Traces user input from entry point to database/response
2. Checks for OWASP Top 10 vulnerabilities at each step
3. Verifies auth checks on every protected endpoint
4. Checks that Supabase RLS policies match expected access patterns
5. Looks for secrets in client bundles or git history

**Output:**

- Findings grouped by severity: **Critical > High > Medium > Low**
- Each finding includes: location, description, proof of concept (if applicable), remediation

---

## Skills

Skills are specialized workflows that Claude invokes automatically based on context. You do not call these manually.

### `security-review` (Auto-Invoked)

**Triggers when:** Code changes touch auth flows, API routes, database queries, or user input handling.

**What it checks:**

| Severity | Checks |
|----------|--------|
| **Critical** | SQL injection via raw queries or unparameterized inputs; XSS via unsanitized user content in JSX (especially `dangerouslySetInnerHTML`); exposed secrets or API keys in client-side code; missing auth checks on API routes; RLS policy bypasses |
| **Warning** | Missing input validation on API route handlers; missing CSRF protection on state-changing endpoints; overly permissive CORS headers; sensitive data in URL query params or logs |
| **Info** | Supabase service role key usage (should only be server-side); missing rate limiting on public endpoints; missing error sanitization (don't leak internal errors to client) |

**Configuration:**

- `disable-model-invocation: false` — can invoke AI models for analysis
- `user-invocable: false` — runs automatically, cannot be called via slash command

---

## Rules

Rules are always-on context files that are automatically loaded into every Claude Code session. They provide persistent instructions that guide all responses without any manual invocation.

### `code-style.md`

Enforces project coding conventions:

- **Imports:** Use `@/*` alias for `src/` imports; import UI from `@repo/ui/<component>`; import `cn()` from `@repo/ui/lib/utils`
- **Components:** Use CVA for variants; merge classes with `cn()`; use Sonner toasts; use plain `<img>` for external URLs (never `next/image`)
- **State:** Zustand stores must use `persist` with `skipHydration: true`; hydrate manually; use `useTheme()` with a `mounted` guard
- **Pages:** Server component `page.tsx` exports `metadata` and renders a client component from `client.tsx`; all protected pages use `<PageSpinner />`

### `auth.md`

Enforces authentication patterns:

- **Middleware:** Next.js 16 uses `src/proxy.ts` (not `middleware.ts`); proxy sets `x-auth-status` and `x-terms-accepted` headers
- **Auth flows:** Email/password, magic link, PKCE OAuth, anonymous guest login; guest login via `POST /api/guest-login` with IP-based rate limiting; MFA with TOTP supported
- **Post-auth toasts:** Use query param pattern (e.g. `?login_success=true`); `AuthToast` component handles all auth-related toast params; always clean up query params after showing toast

### `database.md`

Enforces database access patterns:

- **Clients:** Browser uses `createSupabaseBrowserClient()`; server uses `createSupabaseServerClient()` (wrapped in React `cache()`)
- **Schemas:** `jg_account`, `portfolio`, `activity_tracker`, `currency_calculator`, `fmanager`, `messenger`
- **Conventions:** Always specify schema when querying; use RLS policies (never bypass with service role key in client code); handle errors from every Supabase call

---

## Permissions

### `settings.json` (Shared)

Checked into the repo. Contains default allow/deny lists (currently empty — no shared permissions enforced).

### `settings.local.json` (Local, Gitignored)

Your personal allowlist controlling which tools Claude Code can use without prompting:

| Category | Allowed |
|----------|---------|
| **Web** | `WebSearch`, `WebFetch` for `docs.vercel.com`, `npmjs.com`, `github.com` |
| **Shell** | `cat`, `ls`, `grep`, `pnpm check-types`, `pnpm lint` |
| **Git** | `git add`, `git commit`, `git push` |

Anything not in this list will prompt for approval before executing.

---

## Quick Reference

| What | Type | How to invoke | Auto? |
|------|------|--------------|-------|
| `/fix-issue 42` | Command | Type in Claude Code | No |
| `/review` | Command | Type in Claude Code | No |
| `/ship` | Command | Type in Claude Code | No |
| `code-reviewer` | Agent | Reference in conversation | No |
| `security-auditor` | Agent | Reference in conversation | No |
| `security-review` | Skill | Triggers on auth/API/DB changes | **Yes** |
| `code-style.md` | Rule | Loaded into every session | **Yes** |
| `auth.md` | Rule | Loaded into every session | **Yes** |
| `database.md` | Rule | Loaded into every session | **Yes** |