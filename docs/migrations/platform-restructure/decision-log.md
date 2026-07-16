# Platform Restructure Decision Log

## ADR-001 — Split applications before shared authentication

- Date: 2026-07-17
- Status: Accepted
- Task IDs: PLATFORM-07, PLATFORM-08, PLATFORM-09, PLATFORM-11
- Context: The initial sequence placed the shared Auth/SSO migration before the application split. The user explicitly reprioritized the program around the primary product goal: separate Portfolio from the existing product hub, make the product hub Studio, validate both deployments, and defer shared Auth/SSO until the application boundaries are stable.
- Options considered: complete Auth/SSO first; rename the live application immediately; or use an additive dark launch that leaves the current production root untouched until the independent applications pass validation.
- Decision: build the independent public Portfolio first at `portfolio.jayantgoyal.com`; add a public Studio inventory to the existing application and expose it at `studio.jayantgoyal.com`; validate both; move the apex domains to Portfolio; then finish the Studio rename and cleanup. Shared Auth/SSO work resumes only after this boundary and domain work is stable.
- Why this is the smallest maintainable choice: it creates the approved application boundaries without coupling them to a session migration, and it keeps the currently deployed application available as the rollback target during the cutover.
- Consequences: PLATFORM-08 can start after the content/environment baseline is recorded; PLATFORM-07 no longer depends on PLATFORM-06; PLATFORM-09 can proceed while Auth remains on the existing compatible flow. The original phase IDs retain their architectural meaning even though their execution order changes.
- Code or abstraction deleted/avoided: no temporary shared-auth package, parent-domain cookie, or duplicate Auth deployment is introduced merely to unblock the split.
- Revisit trigger: Portfolio and Studio have passed deployed validation and the apex-domain cutover is stable.

## ADR-002 — One program PR with deployable commits

- Date: 2026-07-17
- Status: Accepted
- Task IDs: PLATFORM-00 through PLATFORM-12
- Context: The user requires the complete restructure to remain reviewable and revertible as one PR instead of being distributed across many PRs.
- Options considered: one PR per phase; direct commits to `main`; or one long-lived program PR containing independently reviewable and deployable commits.
- Decision: use the single `codex/platform-planning` branch and one program PR, with small commits and explicit deployment/proof gates inside that PR.
- Why this is the smallest maintainable choice: it provides one Git rollback surface while retaining commit-level review and deployment checkpoints.
- Consequences: a completed slice is not a stopping point, and no additional implementation PR is opened unless the user changes this decision.
- Code or abstraction deleted/avoided: no temporary integration branches or PR chains.
- Revisit trigger: an external provider or repository policy makes the single-PR approach impossible.
