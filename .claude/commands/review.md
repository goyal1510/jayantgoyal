Review the current uncommitted changes for issues.

## Steps

1. Run `git diff` to see all changes.
2. Review each changed file for:
   - Security vulnerabilities (XSS, injection, exposed secrets)
   - TypeScript type safety issues
   - Missing error handling
   - Breaking changes to existing functionality
   - Performance concerns (unnecessary re-renders, missing memoization)
3. Check adherence to project conventions from CLAUDE.md:
   - Server component wraps client component pattern
   - `cn()` for class merging
   - Sonner toasts for notifications
   - `<PageSpinner />` for loading states
   - Plain `<img>` for external URLs (not `next/image`)
4. Run `pnpm check-types --filter jg` and `pnpm lint` to catch issues.
5. Provide a summary with any findings grouped by severity (critical, warning, suggestion).
