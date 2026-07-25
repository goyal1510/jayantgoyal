# Portfolio UI consistency audit

Date: 2026-07-26

This audit uses fresh captures from the deployed Portfolio, Studio, Admin, and
Auth applications at a desktop viewport. No Figma file or external design
workflow was used.

## Reference pattern

The Writing detail page is the strongest existing editorial surface. It gives a
long-form page a clear reading rhythm:

- a compact header and progress line;
- a left section rail that stays visible while reading;
- one focused reading column;
- a right facts rail for context and a direct CTA;
- a closing conversation prompt and next-article path.

Evidence: [Writing detail](./writing-detail-current.png).

## Before

The Work detail page exposed the right information but used a different system:
the outcome hero, screenshot, facts row, and two-column body made the case study
feel like a separate template. The Work archive also used a dark surface and
irregular screenshot treatment, while Admin and Identity screenshots could look
empty in a full-page capture because they were lazy-loaded below the first two
projects.

Evidence: [Work detail before](./work-detail-current.png), [Work index before](./work-index-current.png), and [Home before](./home-current.png).

## First implementation slice

- Work details now use the Writing reading shell for every published system.
- The section rail, progress indicator, facts rail, project links, engineering
  decisions, and next-case-study path are data-driven from the existing case
  study contract.
- All Work screenshots use one quiet, legible product frame. The product UI
  remains visible; the surrounding editorial surface no longer changes the
  evidence treatment from project to project.
- Work archive surfaces now use the same paper editorial surface as Writing.
- All four Work archive images load eagerly so a visitor never sees a blank
  project slot while moving through the archive.

Evidence: [Work detail after](./work-detail-updated.png), [Work index after](./work-index-updated.png), and [Home after](./home-surface-consistent.png).

## Next UI slice

The next pass should focus on responsive inspection and the homepage's lower
sections: make the Writing preview reveal reliably on first interaction, tighten
the long vertical gaps, and ensure the shared project frame and reading shell
hold at mobile widths.

## Deployed light-mode evidence

The project evidence assets now come from the deployed applications rather than
localhost. All four applications were captured in light mode at a consistent
desktop viewport. Portfolio is shown as the public home surface; Studio, Admin,
and Auth include their full expanded sidebars so the surrounding product
context remains visible.

- [Portfolio home](./deployed-portfolio-home-light-desktop.png)
- [Studio home](./deployed-studio-home-light-sidebar-desktop.png)
- [Studio products](./deployed-studio-products-light-sidebar-desktop.png)
- [Admin home](./deployed-admin-home-light-sidebar.png)
- [Auth security](./deployed-auth-home-light-sidebar.png)
- [Auth providers](./deployed-auth-providers-light-sidebar-desktop.png)

Studio and Auth use the second frame as an auto-advancing project gallery. The
same rectangle and full-sidebar treatment is used by Work previews and case
study covers.
