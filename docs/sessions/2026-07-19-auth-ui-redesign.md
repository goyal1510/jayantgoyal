# Auth UI redesign

- Date: 2026-07-19
- App: `apps/auth`
- Problem: Replace the dialog-first auth entry experience with a polished, responsive two-panel `/welcome` flow while keeping sign-in and sign-up behavior unified.
- Scope: Audit the current Auth entry route, shared brand/SEO contracts, favicon/manifest assets, and mobile behavior before implementation. Generate one project-bound visual asset for the left panel. Keep auth behavior, safe-return handling, and validation accessible.
- Solution: Added a dedicated `/welcome` Auth surface with a responsive split-screen shell, generated editorial artwork, unified email/password sign-in-or-create action, Google continuation, and a compact mobile stack. `/login` and `/register` remain compatibility aliases that redirect to `/welcome`. Added Auth-owned favicon copies, a web manifest, richer noindex metadata, Open Graph/Twitter asset references, theme colors, and app fonts.
- Key decisions: Make `/welcome` the canonical entry route in `@repo/auth` so Studio/Admin handoffs land on the new Auth experience; keep the visual panel decorative and avoid putting critical auth copy inside the generated image; prefer shared brand constants and metadata over new literals.
- Follow-up: Theme selection is now an explicit Light/Dark-only control inside the shared account menu. The account menu lives in the bottom of each Admin, Studio, and Auth sidebar; top bars no longer duplicate the account or theme controls. Existing System selections are migrated to the currently resolved light/dark mode.
- Follow-up: Refined the shared account menu to use a profile-style sidebar trigger, email header, Settings row with chevron, Dark mode switch, and separated Sign out action; the trigger now forwards Radix open-state props so its expanded/focus treatment and keyboard interaction work correctly.
- Follow-up: Matched the sidebar account control to the navigation rhythm: initials use the same compact square treatment as sidebar icons, the chevron is always upward, and the menu width is tied to the trigger so it opens above without spilling outside the sidebar; all menu rows now use consistent height, padding, icon size, and text scale.
- Follow-up: Removed the legacy top-bar max-width from the sidebar account trigger so it now fills the same available width as every other sidebar navigation row.
- Follow-up: Standardized every sidebar footer to contain only the account control. Studio Terms & Conditions now lives in the account menu and opens the existing terms page; Auth no longer repeats an Open Studio action in the footer.
- Follow-up: Removed the now-unused Studio terms dialog wrapper so the terms page is the single terms presentation path.
- Follow-up: Fixed the collapsed-sidebar account menu by keeping the trigger compact while giving the menu a readable 15rem minimum width; expanded sidebars continue to size the menu to the full account row.
