# Search Console and SEO remediation

**Date:** 2026-07-26
**Areas:** Portfolio, Studio, Admin, shared SEO

## Problem

Google Search Console still reflects the pre-split platform, including an old
`www` sitemap, non-public Admin/Auth sitemap submissions, legacy redirect
chains, an inaccessible Admin robots policy, a Studio robots warning, and
several metadata and soft-404 issues.

## Current scope

- Make Admin expose an explicit no-crawl robots response without authentication.
- Remove the unsupported Studio robots directive.
- consolidate legacy Portfolio and Studio redirects into permanent,
  single-purpose routes where appropriate.
- Retire known deleted Writing URLs and keep unknown entries out of the index.
- Improve public metadata semantics without changing the visible design.
- Add focused regression tests, validate all affected applications, deploy, and
  reconcile Search Console with the canonical Portfolio and Studio sitemaps.

## Key decisions

- Portfolio and Studio remain the only sitemap-bearing public applications.
- Admin and Auth remain deliberately non-indexable.
- Existing article excerpts and visible copy stay unchanged; metadata is
  normalized separately when necessary.
- Legacy API redirects remain temporary because API ownership can change;
  legacy public page redirects are permanent to consolidate search signals.

## Implemented

- Added an unauthenticated Admin `robots.txt` route that explicitly disallows
  crawling, bypasses Supabase Auth entirely, and preserves the global
  `X-Robots-Tag` policy.
- Removed the unsupported `Content-Signal` directive from Studio robots output.
- Changed legacy public Studio page redirects from temporary to permanent while
  keeping session and API ownership redirects temporary.
- Added explicit permanent redirects for the retired Portfolio route, old
  résumé asset, old Blog root, and all three deleted Writing records.
- Missing Writing metadata now enters the not-found flow instead of returning a
  synthetic 200 metadata result.
- Shared public metadata now falls back to the canonical app description when
  CMS copy is blank and truncates overlong descriptions without changing
  visible page content.
- The dedicated Contact page now uses an H1 while the homepage Contact section
  retains its H2.
- Studio product overview pages and terms now have distinct, descriptive search
  metadata.
- Added focused regression coverage for Admin crawler access, the Admin robots
  policy, Studio robots output, Studio product titles, shared metadata
  fallback/truncation, and legacy redirect behavior.

## Validation notes

- The first focused test run exposed an unnecessary Admin auth lookup for
  `robots.txt`; the route now exits before Supabase client creation.
- Studio product metadata was extracted from the TSX route into a focused helper
  so its title/canonical contract can be tested without loading page UI.
- Next.js returns HTTP 200 with `noindex` when a dynamic not-found is discovered
  after streaming starts. The three known deleted articles now bypass that
  behavior through permanent redirects, and arbitrary missing slugs remain
  absent from the sitemap with explicit `noindex`.

## Validation

- Focused SEO and crawler suite: 23 tests passed.
- Complete repository suite: 61 files and 298 tests passed.
- Root zero-warning lint and strict TypeScript checks passed across all 11
  runnable packages/apps.
- Portfolio, Studio, and Admin production builds passed.
- Architecture, service-role boundary, and synchronized brand-asset checks
  passed.
- Local production HTTP checks confirmed permanent legacy redirects, public
  Admin robots output with no auth redirect, warning-free Studio robots output,
  About metadata fallback, a Contact H1, distinct Studio product titles, and
  the terms description.
