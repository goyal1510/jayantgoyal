# Three-Environment Contract

## Scope

- Keep exactly three deployment contexts: localhost Development, Vercel-managed
  Preview, and final-domain Production.
- Remove the persistent staging layer from Cloudflare, Vercel, Git, Supabase
  Auth callbacks, application URL contracts, tests, and migration records.
- Preserve generic Vercel previews for application-local validation and retain
  only production domains for cross-application production behavior.
- Verify the resulting provider and repository inventories without exposing
  credentials or environment values.

## Working State

- Branch: `codex/three-environment-contract`
- Base: merge commit `525e9d0` on `origin/main` (PR #40)
- Source clone remains clean and read-only for implementation.
- No Supabase schema or migration change is planned for this slice; only the
  hosted Auth redirect allowlist may be narrowed through a scoped Management API
  patch after read-before-write verification.

## Decisions

- The user explicitly replaced the four-context model with three contexts:
  Development, Preview, and Production.
- Vercel-generated Preview URLs remain provider-managed; no stable branch
  domains, wildcard DNS, or custom preview token broker will be retained.
- Cross-subdomain SSO cannot be proven on unrelated Vercel preview hosts and
  will be validated after production deployment in its later approved phase.
- Removal is exact and additive to the current production contract: e-commerce,
  mail, apex, `www`, and final Portfolio/Studio/Admin domains remain untouched.

## Progress

- Created a dedicated worktree from current `origin/main`, then renamed it when
  the environment decision changed.
- Copied six ignored `.env*` files and safe non-secret Supabase link/version
  metadata; no pooler URL or token was copied.
- Briefly added `admin.staging.jayantgoyal.com` while following the superseded
  plan, then removed its Cloudflare record and Vercel domain after the user
  stopped staging work. Read-back confirmed both provider records are absent.
- The resulting Admin staging deployment completed before it could be canceled;
  it is not assigned to a custom domain and will be left as an ordinary preview
  artifact in Vercel history.
- Removed the Portfolio and Studio staging domains from their exact Vercel
  projects and deleted their two unproxied Cloudflare CNAME records. Provider
  read-backs show no remaining `*.staging.jayantgoyal.com` domain or DNS record.
- Deleted all six branch-scoped Vercel environment entries: two from Portfolio,
  three from Studio, and one from Admin. Development, generic Preview, and
  Production assignments were left intact.
- Removed all four staging callback families from the hosted Supabase Auth
  allowlist through a scoped Management API patch. Replaced the obsolete
  pre-rename Studio Preview wildcard with the current `jayantgoyal-studio-*`
  family; read-back confirms 19 URLs, zero staging entries, Google/email still
  enabled, and the production Site URL unchanged.
- Deleted the remote `staging` branch after proving it was byte-for-byte at the
  same commit as `origin/main` and had no open pull request.
- Deleted the orphaned `portfolio.jayantgoyal.com` Cloudflare CNAME after Vercel
  read-back confirmed no project owned that hostname. The Portfolio apex and
  `www` production domains remain assigned and healthy.
- Removed the retired hostname from Portfolio's profile map and replaced the
  redirect-ledger rollback dependency with the immutable generated Vercel URL.
  The default profile behavior remains unchanged.
- Revised the binding environment, architecture, phase-gate, decision, proof,
  and repository guidance to the three-context contract. Cross-subdomain auth
  proof now requires a controlled Production rollout; Preview remains
  application-local.
- Validation passes across twelve Vitest files and forty-nine tests. Tracked
  environment examples confirm Portfolio `3000`, Studio `3001`, and Admin
  `3002`; targeted Markdown formatting is applied only after the contract edits
  were complete.
- Final validation also passes `git diff --check`, targeted Prettier checking,
  Portfolio type generation/TypeScript, zero-warning ESLint, and the Portfolio
  production build. The build used the existing hardcoded public-data fallback
  because this fresh worktree has no Portfolio `.env.local`; compilation and all
  generated routes completed successfully.
- Vercel decrypted-value comparisons confirm every public URL contract for the
  three projects: exact localhost Development values, no fixed Preview site URL,
  canonical cross-app Preview links, canonical Production values, and zero
  branch-scoped entries. Authoritative DNS returns no record for the retired
  Portfolio or staging hosts. Production smoke returns `200` for Portfolio and
  Studio; Admin performs its expected one redirect and then returns `200`.
- PR #41's Portfolio Preview completed at commit `e509bb2` and returns `200`
  with `Jayant Goyal | Full-Stack Developer`. Vercel rate-limited the unchanged
  Admin and Studio projects before their ignore-build scripts could run; those
  provider checks are unrelated to this Portfolio-only source cleanup and are
  recorded rather than hidden.
- A later provider audit re-read all three Vercel inventories by project name.
  Each has zero branch-scoped variables and zero staging-named variables; the
  assigned domains are only the final Portfolio, Studio, and Admin hosts plus
  provider-generated URLs. Authoritative public DNS returns no record for
  `portfolio.jayantgoyal.com` or any former staging hostname.
- Admin did not consume its Development or Production
  `NEXT_PUBLIC_SITE_URL` entries. Both were removed, the tracked example and
  contract were corrected, and the remaining seven Admin variables were traced
  to Supabase or deployment-management consumers. Admin's project build command
  was also aligned to `pnpm --filter admin build`; its ignored-build override
  remains absent.
