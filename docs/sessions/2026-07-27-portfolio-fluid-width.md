# Portfolio fluid width

- **Date:** 2026-07-27
- **Area:** Portfolio editorial layout
- **Problem:** The global 1440px shell leaves roughly 240px of unused space on each side of a 1920px viewport, making the hero and navigation feel overly boxed in.
- **Solution:** Updated `apps/portfolio/src/app/editorial.css` so the shared shell spans the viewport with responsive 24–80px edge gutters instead of stopping at 1440px. Mobile gutters remain 16px and 12px at the existing breakpoints.
- **Supporting adjustment:** Capped the hero field-note card at 560px and aligned it to the right so it can grow on a 1920px display without becoming oversized on ultrawide screens.
- **Key decision:** Express the gutters through the shell width calculation because several shell-based components own their own padding declarations. Individual typography and content caps remain responsible for readability.
- **Validation:** At 1920px the shell renders 1766px wide with 76.8px side gutters, the hero note renders 525px wide, and the page has no horizontal overflow. At 2560px the shell keeps 80px gutters and the note stops at 560px. The 375px mobile layout retains 12px gutters without overflow.
- **Route coverage:** Confirmed no horizontal overflow on the home, About, Work, Writing, Resume, and Contact routes at 1920px. Portfolio lint, TypeScript checks, production build, Prettier, and `git diff --check` pass.
