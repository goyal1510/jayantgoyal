# Portfolio project showcase

- **Date:** 2026-07-24
- **Area:** Portfolio project/work section
- **Problem:** Project artwork currently repeats the same upright rectangular treatment, making the work grid feel visually uniform.
- **Direction:** Recompose project imagery as varied, layered paper-like objects with controlled rotation, offsets, proportions, and depth while preserving responsive readability and project-link usability.
- **Implementation:**
  - Added two decorative, hidden paper layers behind every project screenshot.
  - Added six deterministic compositions keyed by project index, varying sheet width, cut shape, rotation, tape placement, backing-paper ratio, and offset.
  - Preserved each screenshot's full aspect ratio and added subtle hover separation between the stacked layers.
  - Preserved the existing alternating image/copy rhythm and added a compact mobile treatment.
- **Files changed:** `apps/portfolio/src/components/editorial/portfolio-experience.tsx`, `apps/portfolio/src/components/editorial/project-showcase.tsx`, `apps/portfolio/src/components/editorial/portfolio-navigation.tsx`, `apps/portfolio/src/app/editorial.css`, `apps/portfolio/src/app/work/page.tsx`, `apps/portfolio/src/app/sitemap.ts`, and `apps/portfolio/src/lib/seo/config.ts`.
- **Decision:** Use index-based variants instead of runtime randomness so server and client rendering remain stable and the composition never jumps between visits.
- **Validation:**
  - Portfolio ESLint, TypeScript, Prettier, and production build pass.
  - Desktop review at 1440×1000 and mobile review at 390×844 confirmed distinct compositions, full screenshot legibility, zero horizontal overflow, and no browser console errors.
- **Status:** Implementation and visual validation complete.

## Supabase content ordering follow-up

- **Request:** Verify that certificates, blogs, projects, experience, and education are ordered newest-first, then align their persisted order values with descending date order.
- **Approach:** Inspect the live `jayantgoyal` schema and rows first, identify the canonical date and order columns for each collection, apply only the necessary row updates, and re-query the final ordering.
- **Audit results:**
  - Blog queries already sort `published_at` descending and the three live rows were already correct; `blog_posts` has no manual order column.
  - Experience was already descending by start date, so its order values were left unchanged.
  - Education was oldest-first and was reversed to 2024, 2020, 2018.
  - Projects now group both `2025—26` entries before the `2025` and `2024` entries while preserving the existing order within equal-year groups.
  - Certificate `issued_at` values were empty. Dates were recovered from the five source PDFs and saved before assigning newest-first order values.
- **Remote updates:** Five certificates, three education rows, and nine projects were matched in a guarded transaction. A follow-up query confirmed the persisted order.
- **Gotcha:** An initial count guard used a constant division-by-zero fallback that PostgreSQL evaluated while planning. The enclosing transaction rolled back with no partial writes; the successful retry used explicit procedural row-count checks.
- **Status:** Live Supabase ordering update and verification complete; local preview remains running for manual review.

## Curated homepage and work archive

- **Request:** Reduce the homepage length while keeping all nine projects accessible.
- **Direction:** Replace the nine full homepage stories with four featured projects in a compact 2×2 grid, retain the original torn-screenshot image treatment, and move the complete story treatment to a dedicated `/work` page.
- **Implementation:**
  - Added reusable featured-project and full-archive components using the portfolio's original torn-screenshot artwork.
  - The homepage now takes the first four Supabase-ordered projects for a compact 2×2 showcase and links to the complete archive.
  - Added `/work` with all visible projects, full descriptions, metadata, tags, and external links.
  - Updated subpage Work navigation, active-page semantics, sitemap coverage, and the significant-update date.
  - Added responsive featured-grid, compact card, archive, and work-page hero styles without changing the previous project-image appearance.
- **Decision:** Derive featured work from the first four `sort_order` rows so Admin/Supabase ordering remains the only editorial control and no schema migration is required.
- **Validation:**
  - Portfolio ESLint, TypeScript, Prettier, `git diff --check`, and the production build pass.
  - Desktop browser review at 1440×1000 confirmed a two-column homepage grid with exactly four projects, a `/work` archive with all nine projects in the expected newest-first order, active Work navigation, and zero horizontal overflow.
  - Mobile browser review at 390×844 confirmed a one-column homepage grid, all nine archive entries, active Work navigation in the mobile menu, zero horizontal overflow, and no browser console errors.
  - Follow-up review restored the original clipped screenshot artwork, removed every added backing-paper layer, and reconfirmed the four-card desktop/mobile grids with zero overflow or console errors.
  - The local Portfolio preview remains running on port 3000 for manual validation.
- **Status:** Implementation, automated checks, and responsive visual validation complete.

## Compact editorial rhythm follow-up

- **Request:** Reduce the overall homepage length, oversized display text, repeated section spacing, and the blank area below the Contact form without using Figma or removing portfolio content.
- **Evidence:** A rendered spacing audit measured the homepage at 14,614 px (16.2 viewports) at 1440×900 and 17,637 px (20.9 viewports) at 390×844. Experience was the largest section at 4,250 px, and the Contact footer used a 172.8 px top margin.
- **Implementation:**
  - Reduced shared desktop section padding from roughly 130–144 px to a 72–104 px responsive range and tightened the mobile minimum rhythm.
  - Moderated hero and section display-heading scales while preserving body-copy readability.
  - Reduced heading-to-content gaps and repeated vertical padding across About, Education, Skills, Experience, Activity, Work, Writing, and Contact.
  - Compressed education and experience timeline rows, certificate-deck height, capability rows, featured-project spacing, and mobile stacked layouts.
  - Converted the four featured projects into a touch-friendly horizontal tray on mobile so the section keeps all four projects without consuming several vertical screens.
  - Shortened the Contact paper, textarea, form gaps, and footer gap while increasing footer icon targets from 32 px to 36 px.
- **Decision:** Preserve all current sections and content for this iteration; improve page length through rhythm and component density before considering stronger homepage curation.
- **Validation:**
  - Desktop at 1440×900 decreased from 14,614 px to 12,133 px, a 2,481 px / 17% reduction. The Experience section decreased from 4,250 px to 3,439 px, and Featured Work decreased from 2,305 px to 1,977 px.
  - Mobile at 390×844 decreased from 17,637 px to 14,111 px, a 3,526 px / 20% reduction. The featured-project tray contains all four projects, has no page-level horizontal overflow, and exposes the next card as a swipe cue.
  - Contact decreased from 1,113 px to 845 px on desktop. The paper decreased from 707 px to 583 px, the textarea is 110 px, and the footer gap decreased from 172.8 px to 72 px, allowing the complete Contact section and footer to fit within one desktop viewport.
  - Browser review confirmed the compact hero, Experience, Work, and Contact compositions at desktop and mobile sizes with no console errors or horizontal page overflow.
  - Portfolio ESLint, TypeScript, Prettier, `git diff --check`, and the production build pass.
- **Status:** Compact-spacing implementation and responsive validation complete.

## Hero color, copy density, and heading alignment

- **Request:** Make the black-and-paper hero feel less plain, reduce the amount of homepage copy in About and Experience, and fix the detached alignment between section eyebrows and their titles.
- **Implementation:**
  - Reused the existing coral palette by highlighting “ambitious” in the hero headline, changing the field-note paper to soft coral, and applying coral to the project-wall link underline and arrow.
  - Kept normal-size hero text in the dark ink color so the existing accessible contrast is preserved.
  - Reduced each Experience entry to its first two persisted outcomes and removed the repeated summary whenever outcomes are available.
  - Reduced About to the section overview and one editorial lead statement; the longer Supabase story content remains stored and unchanged.
  - Moved all shared section eyebrows into the same content column as their headings, including About, Capabilities, Career, Activity, Work, Education, and Credentials.
  - Applied the same eyebrow-above-title relationship at mobile breakpoints with a compact 14 px gap.
- **Decision:** Treat this as presentation-level curation. No Supabase copy was deleted or rewritten, so the fuller source material remains available for later detail pages or résumé content.
- **Validation:**
  - Desktop browser review confirmed the new coral hero treatment and directly aligned About and Career headings.
  - Mobile browser review at 390×844 confirmed the hero wraps cleanly, the coral note remains legible, and About uses a clearer two-block hierarchy.
  - The rendered Experience contract now exposes exactly two outcome bullets per role without the redundant summary paragraph.
  - Portfolio ESLint, TypeScript, Prettier, `git diff --check`, and the production build pass.
- **Status:** Color, content-density, and section-heading alignment iteration complete; the local Portfolio preview remains running on port 3000.

## Compact functional section headers

- **Request:** Replace the oversized, slogan-heavy About, Capabilities, and Career introductions shown in the supplied screenshots.
- **Audit finding:** Each introduction repeated three levels of messaging—the slash-separated eyebrow, a very large manifesto headline, and a supporting paragraph—while using most of a viewport before the section's useful content appeared.
- **Implementation:**
  - Added a shared parser that treats the text before `/` as the section label and the text after `/` as the concise functional title.
  - Replaced the long display slogans with shorter persisted titles such as `About / Product mind, engineering hands`, `Capabilities / Across the stack`, and `Career / The path so far`.
  - Extended the same treatment to Activity, Featured Work, Education, and Credentials.
  - Rebuilt shared desktop headers as a full-width ruled row with the title on the left and one supporting sentence on the right.
  - Reduced the heading scale and stacked the same hierarchy cleanly on mobile.
  - Kept the longer Supabase headlines stored and unchanged; they are simply no longer repeated in these homepage section introductions.
- **Validation:**
  - Desktop browser review confirmed that About content, capability rows, and the first career entry now appear within the same viewport as their section header.
  - Mobile review at 390×844 confirmed readable wrapping, consistent title order, and clean reflow in the dark Career section.
  - Portfolio Prettier, ESLint, TypeScript, `git diff --check`, and the production build pass.
- **Status:** Compact section-header redesign and responsive validation complete.

## Complete homepage section-header sweep

- **Correction:** The first compact-header pass missed Writing and Contact because both sections used custom markup instead of the shared section-heading component.
- **Implementation:**
  - Converted Writing to the same `Writing / Notes from the build` hierarchy, with the article archive action kept beside the concise title.
  - Moved Contact into the shared full-width header pattern as `Contact / Start a conversation`.
  - Removed the oversized Contact slogan from the homepage presentation while preserving its Supabase value.
  - Kept Hero as the only intentional exception because it is the page introduction rather than a content-section header.
- **Coverage:** About, Education, Capabilities, Career, Credentials, Activity, Featured Work, Writing, and Contact now use the compact functional hierarchy.
- **Validation:**
  - Desktop and 390×844 mobile browser reviews confirmed Writing and Contact now match the other sections and reflow cleanly.
  - Portfolio Prettier, ESLint, TypeScript, `git diff --check`, and the production build pass.
- **Status:** Every homepage content section is now covered.

## Shipping readiness

- Added focused unit coverage for slash-separated section-heading parsing, fallback headlines, and missing compact titles.
- Confirmed local environment files, build output, browser screenshots, and Supabase CLI state remain ignored and outside the commit.
- The final commit is limited to the Portfolio UI, its `/work` archive route, public navigation/SEO updates, focused helper coverage, and this session record.
