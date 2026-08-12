# Portfolio GitHub Showcase Restoration

- **Date:** 2026-08-10
- **Area:** Portfolio application
- **Problem:** The redesigned Portfolio no longer exposes the GitHub-powered contribution calendar and related developer activity that existed in the previous experience.
- **Current approach:** Restore the removed GitHub activity experience inside the current editorial homepage rather than reverting the redesign.
- **Worktree:** `codex/portfolio-github-showcase`

## Decisions

- Preserve the current Portfolio visual language and data architecture.
- Treat previous GitHub integration code and recent Git history as the source of truth for behavior.
- Keep GitHub token usage server-only through the shared `@repo/github` client.
- Load expensive repository-language statistics after the page renders so a provider failure never blocks the Portfolio itself.
- Reuse the CMS-controlled `activity` visibility and copy that remained after the UI was deleted.

## Status

- Confirmed commit `7f243c2` removed the contribution calendar, repository metrics, language distribution, and `/api/github-loc` while leaving the CMS activity contract and GitHub configuration intact.
- Added a responsive homepage GitHub activity section with a five-year selectable contribution calendar, five live code metrics, language distribution, and profile link.
- Restored the cached server API route and Portfolio dependencies for `@repo/github` and `react-github-calendar`.
- Formatted the restored TypeScript, component, stylesheet, package, and session files with the repository formatter.
- Added one bounded retry for transient server/provider failures after the first cold browser request returned 503; the next route request returned the live metrics successfully.
- Browser QA confirmed desktop rendering, the selectable 2025 calendar state, contained mobile horizontal scrolling, and live metrics; adjusted mobile metric sizing so the top-language value remains readable.
- Restoration and validation are complete.

## Files changed

- `apps/portfolio/src/components/editorial/github-activity.tsx`
- `apps/portfolio/src/components/editorial/github-contributions.tsx`
- `apps/portfolio/src/components/editorial/github-code-stats.tsx`
- `apps/portfolio/src/components/editorial/portfolio-experience.tsx`
- `apps/portfolio/src/app/api/github-loc/route.ts`
- `apps/portfolio/src/app/editorial.css`
- `apps/portfolio/package.json`

## Validation

- `pnpm --filter portfolio build` — passed; `/api/github-loc` is included as a dynamic Portfolio route.
- `pnpm --filter portfolio check-types` — passed.
- `pnpm --filter portfolio lint` — passed with zero warnings.
- `pnpm test` — 63 files and 305 tests passed.
- Prettier check — passed for every changed source/config/session file.
- Live browser/API QA — contribution calendar loaded 762 contributions for the last year; selecting 2025 loaded 289 contributions; repository metrics loaded 76.6K estimated lines, 4 active repositories, 6 languages, TypeScript as the top language, and 4+ years on GitHub.
- Responsive QA — desktop section and mobile metrics inspected visually; the 978px calendar stays within its 326px mobile scroller and the page itself has no horizontal overflow at 390px.
- API validation — missing and malformed usernames return HTTP 400; transient upstream failures render a non-blocking fallback and receive one bounded client retry.

## Gotchas

- The first cold GitHub metrics request returned 503 while the provider connection warmed; a second request succeeded, motivating the bounded retry.
- GitHub SSH fetch was unavailable during worktree setup, but local `main` and the recorded `origin/main` were already aligned at `3e418cb`.
- Supabase project identity was verified as `jayantgoyal` (`orwfvyditlguqvxvztkw`); the setup-only migration-history check stalled while initializing the login role and was cancelled. No database or migration change was part of this task.

## Design revision

- The first restored GitHub section was rejected as visually too bulky and disconnected from the editorial Portfolio.
- Paused implementation and started a three-direction visual exploration focused on a quieter, more integrated hierarchy while preserving the calendar, live metrics, year control, and language breakdown.
- Selected the first visual direction: a warm-paper editorial ledger with a large serif heading, direct contribution calendar, typographic metric row, and restrained language bar.
- Replaced the dark torn-paper dashboard treatment with the selected flat editorial composition while retaining the live contribution and repository-stat integrations.
- Made the current rolling year the visible default period, kept five prior fixed-year choices, moved the GitHub profile into the calendar masthead, and adopted the selected restrained green contribution scale.
- Uses the selected `Activity` / `GitHub Activity` functional masthead while continuing to source the supporting description and visibility from the Portfolio editorial contract.
- Matched the selected square contribution-cell treatment instead of retaining the calendar package's default rounding.
- Tightened the section, calendar, metric, and language spacing after the first side-by-side comparison showed the implementation was vertically looser than the selected reference.
- Aligned the live-stat loading and unavailable rows with the refined ledger spacing so state changes do not reintroduce the earlier oversized vertical gap.
- Re-ran Portfolio type checking and linting after the redesign; both pass. Formatted the focused source, session, and workspace lockfile changes.
- Rebuilt the Portfolio successfully with the redesigned activity section; `/api/github-loc` remains present as a dynamic route.
- Desktop browser verification at 1440×1024 confirms the selected year control, live 76.6K/4/6/TypeScript/4+ metrics, profile link, and language distribution with no page overflow or console warnings/errors.
- Mobile browser verification at 390×844 confirms the calendar remains intentionally horizontally scrollable inside its 366px viewport while the 390px page itself has no horizontal overflow; live stats and responsive ledger rows load without console warnings/errors.
- Interaction QA changed the period to 2025 and confirmed the calendar updated to 289 contributions before restoring the default rolling 2026 presentation for the final captures.
- Final validation passed: Portfolio build, type checking, zero-warning lint, focused Prettier check, and the full 63-file/305-test Vitest suite.
- Completed the required side-by-side design QA loop; the first spacing mismatch was corrected and `design-qa.md` records a final passed result with only optional P3 polish remaining.
- Regenerated the workspace lockfile offline after formatting had caused unrelated churn; its final diff is limited to the two restored Portfolio dependencies. The lockfile retains pnpm's repository-native YAML style, so it is intentionally excluded from the Prettier check.
