# Portfolio Conversion

**Date:** 2026-07-26

## Areas

- Portfolio Work index and case-study pages
- Portfolio contact, résumé, GitHub, and live-product paths
- Portfolio conversion analytics
- Canonical Portfolio CMS Work records

## Problem

The portfolio architecture, content model, and search visibility are in place,
but the four primary Work entries need to explain Jayant's product and
engineering contribution more convincingly. The routes also need a clear,
measurable path from reading a case study to contacting Jayant, viewing the
résumé, reviewing source code, or opening the live product.

## Scope

- Review the canonical Work records for Portfolio, Studio, Admin, and Auth.
- Strengthen their case-study narratives using only verified implementation
  details and claims.
- Improve the calls to action on Work surfaces without redesigning the site.
- Measure meaningful conversion actions without collecting personal data.
- Add focused regression coverage and validate the affected applications.
- Publish the reviewed CMS content and deploy the code changes to production.

## Decisions

- Keep exactly four primary Work entries: Portfolio, Studio, Admin, and Auth.
- Treat Studio's tools, games, and workspaces as capabilities within Studio,
  not as separate portfolio projects.
- Keep the public identity as “Jayant”; “Jayant Goyal” remains domain-only.
- Preserve Blog/Writing and Résumé as first-class portfolio destinations.
- Do not invent user counts, revenue, performance gains, or client outcomes.
- Do not introduce a new database migration for editorial or analytics work
  unless the existing contracts prove insufficient.

## Implementation

- Rewrote the canonical Portfolio, Studio, Admin, and Auth Work records in the
  linked `jayantgoyal` Supabase project (`orwfvyditlguqvxvztkw`).
- Renamed the public `identity-sso` Work entry to `auth`, matched it to the
  actual application name, and retained a permanent compatibility redirect.
- Replaced outdated next-step claims for Portfolio and Admin with current,
  evidence-backed improvements.
- Kept Studio as one product suite; its tools, games, storage, tracking,
  Scratchpad, calculators, and weather remain capabilities inside that study.
- Added a case-study path to a context-aware Contact form and a parallel path
  to the résumé.
- Added privacy-safe analytics for case-study views, Work/source/product
  selections, contact intent, résumé downloads, and successful contact leads.
- Expanded the Portfolio Content Security Policy for Google Analytics
  collection hosts without allowing unrelated origins.

## Verification

- Supabase preflight and post-write reads both returned exactly four canonical
  visible, published Work records.
- Every Work record contains all required case-study fields, three engineering
  decisions, and four verified technology tags.
- Full test suite: 63 files and 303 tests passed.
- Full monorepo lint and type checks passed.
- Portfolio production build passed.
- Local production smoke checks passed for `/work`, all canonical case studies,
  the contextual Contact form, the Auth compatibility redirect, and analytics
  CSP headers.
- Production deployment `dpl_2wZnhipsF5y6qEnWvQYy5K4fuaes` reached Ready.
- Production smoke checks passed on `jayantgoyal.com` for the canonical Work
  archive, Auth and Portfolio studies, contextual Contact form, analytics
  annotations and CSP, and the `/work/identity-sso` compatibility redirect.

## Status

Complete and verified in production.
