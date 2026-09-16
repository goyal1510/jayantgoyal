# Orbit glossary and sources

> **Status: proposed future product.** Orbit is not currently implemented, deployed, or provisioned. These requirements describe an approved documentation target, not current runtime behavior.

This page preserves the proposal vocabulary, evidence boundary, repository references, and primary technical sources.

## 25. Glossary

**IAM:** the existing identity/access-management data and capability layer. **Product entitlement:** permission to enter Orbit at all. **Workspace:** a team/data-isolation boundary inside Orbit, not an IAM workforce. **Board role:** permission on one board. **RLS:** PostgreSQL Row Level Security. **RPC:** an explicitly exposed database function call. **DTO:** a safe, intentionally selected data shape returned to the interface. **Outbox:** durable delivery intent committed alongside a data change. **Idempotency:** repeating the same logical request does not repeat its effect. **Revision:** a version used to detect stale writes. **Channel epoch:** a changeable topic generation used to stop sending new messages to old authorization contexts. **P0/P1/P2:** release priorities, not dates or effort estimates.

---

---

## 26. Sources and verification notes

Sources were accessed during preparation on September 16, 2026. Repository contracts are the baseline, not proof of live deployment state. Most of this document is original proposed product design; citations support the specific existing-system and platform behaviors noted in the text. Re-read implementation-dependent documentation and the Supabase changelog when coding. No vendor pricing, trademark clearance, security audit, or live infrastructure verification is claimed.

### Repository sources

- **[R1] Repository README:** https://github.com/goyal1510/jayantgoyal/blob/main/README.md — current app layout, shared packages, commands, and monorepo boundaries.
- **[R2] Naming contract:** https://github.com/goyal1510/jayantgoyal/blob/main/docs/shared-systems/design-and-brand/naming-contract.md — person/product/technical namespace distinction.
- **[R3] Runtime topology:** https://github.com/goyal1510/jayantgoyal/blob/main/docs/architecture/runtime-topology.md — independent clients, shared Supabase, authorization boundaries, and deployment-state caveat.
- **[R4] Shared web session and return contract:** https://github.com/goyal1510/jayantgoyal/blob/main/docs/shared-systems/authentication/cookie-and-return-contract.md — cookie modes, trusted hosts, exact returns, cache/logging behavior.
- **[R5] Authentication ownership:** https://github.com/goyal1510/jayantgoyal/blob/main/docs/shared-systems/authentication/README.md — Auth/UI ownership, IAM distinction, product reauthorization.
- **[R6] Technology catalog:** https://github.com/goyal1510/jayantgoyal/blob/main/docs/reference/technology-catalog.md — documented stack; inspect manifests for actual installed versions.
- **[R7] Schema catalog:** https://github.com/goyal1510/jayantgoyal/blob/main/docs/shared-systems/data/schema-catalog.md — IAM/profile ownership, product schemas, storage, and retired objects.
- **[R8] Documentation index/policy:** https://github.com/goyal1510/jayantgoyal/blob/main/docs/README.md — proposed-product handling and current-state documentation governance.
- **[R9] Branch-head snapshot:** https://github.com/goyal1510/jayantgoyal/tree/44c5fc6a405b416d712a283ce8c2f504b1595fed — branch head reported during review; contract files were fetched from main.

### Official technical sources

- **[S1] Supabase SSR advanced guide:** https://supabase.com/docs/guides/auth/server-side/advanced-guide — session/cookie/cache/client isolation considerations.
- **[S2] Supabase Realtime authorization:** https://supabase.com/docs/guides/realtime/authorization — private-topic policies, authorization caching, and locked system-schema behavior.
- **[S3] Securing the Supabase Data API:** https://supabase.com/docs/guides/api/securing-your-api — explicit grants, RLS, and distinct product access paths.
- **[S4] Supabase Storage buckets:** https://supabase.com/docs/guides/storage/buckets/fundamentals — private downloads and time-limited signed URLs.
- **[S5] W3C WCAG 2.2:** https://www.w3.org/TR/WCAG22/ — accessibility target, including non-drag pointer alternatives.
- **[S6] Next.js data security:** https://nextjs.org/docs/app/guides/data-security — Server Actions as callable endpoints, validation, authorization, and safe server/client data boundaries.
- **[S7] Supabase Row Level Security:** https://supabase.com/docs/guides/database/postgres/row-level-security — role/row policies, caller identity, and metadata limitations.
- **[S8] Supabase database functions:** https://supabase.com/docs/guides/database/functions — invoker/definer behavior, search path, and execution grants.
- **[S9] Supabase backups:** https://supabase.com/docs/guides/platform/backups — plan-dependent database backups and exclusion of Storage object bytes.
- **[S10] Supabase changelog:** https://supabase.com/changelog — reviewed for relevant platform changes; do not create functions/tables inside locked `realtime` schema or assume automatic Data API grants.
- **[S11] Supabase full-text search:** https://supabase.com/docs/guides/database/full-text-search — native PostgreSQL text search and indexing.
- **[S12] Supabase Storage access control:** https://supabase.com/docs/guides/storage/security/access-control — policies for upload/read/update/delete behavior.
