# Cloudflare CLI setup

- Date: 2026-07-17
- Area: Local infrastructure tooling
- Problem: Install a repository-local Cloudflare CLI so DNS can be inspected and managed deliberately.
- Status: Wrangler is installed and verified locally (`4.111.0`); OAuth login succeeded using the macOS keychain; a narrowly scoped DNS API token is stored in the macOS keychain and successfully verified against the active `jayantgoyal.com` zone. The user-approved stale DNS cleanup is complete.
- Decisions: Keep the CLI local to this repository; never install it globally or store credentials in Git.
- Files changed: Root `package.json`, `pnpm-lock.yaml`, and this session entry.
- Verification: `pnpm wrangler --version` returned `4.111.0`; Cloudflare token verification and read-only zone lookup succeeded.
- Limitation: Wrangler does not expose a DNS-record command; DNS changes will use Cloudflare's DNS API and require an explicit review before any mutation.
- Read-only audit: The Vercel team currently contains four projects with five assigned custom domains (`jayantgoyal.com`, `www`, `admin`, `ecommerce`, and `becommerce`); all have production deployments. Cloudflare also contained legacy-looking Vercel CNAMEs for `accounts`, `admin-employee`, `auth`, and `employee`; each returned Vercel `DEPLOYMENT_NOT_FOUND` and was not assigned to a current team project.
- DNS cleanup: On the user's explicit instruction, deleted the four stale CNAME records for `accounts.jayantgoyal.com`, `admin-employee.jayantgoyal.com`, `auth.jayantgoyal.com`, and `employee.jayantgoyal.com`. Cloudflare confirmed each deletion; a subsequent read-only inventory confirmed that none remain. No Vercel project, mail, verification, or other DNS record was modified.
