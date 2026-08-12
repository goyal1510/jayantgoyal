# GitHub Activity Design QA

## Evidence

- Source visual truth: `/Users/jgoyal1510/.codex/generated_images/019fec0d-db13-7512-9b4e-e812e91fac35/exec-9a4d5af3-55c4-4d89-ad90-0fbafe453cc4.png`
- Desktop implementation: `/Users/jgoyal1510/Desktop/Jayant/Developer/projects/worktrees/jayantgoyal/portfolio-github-showcase/.codex-github-activity-desktop-refined.png`
- Mobile implementation: `/Users/jgoyal1510/Desktop/Jayant/Developer/projects/worktrees/jayantgoyal/portfolio-github-showcase/.codex-github-activity-mobile-viewport.png`
- Side-by-side comparison: `/Users/jgoyal1510/Desktop/Jayant/Developer/projects/worktrees/jayantgoyal/portfolio-github-showcase/.codex-github-activity-comparison-refined.png`
- Desktop viewport and source canvas: 1440 × 1024 CSS px, device scale factor 1. Source and desktop implementation are both 1440 × 1024 pixels; no density normalization was required.
- Mobile viewport: 390 × 844 CSS px, device scale factor 1. The mobile capture is 390 × 844 pixels.
- State: light editorial theme, rolling current-year contribution period shown as 2026, live GitHub calendar and repository statistics loaded.

## Full-View Comparison

The generated option and implementation were combined into one comparison image before review. The implementation preserves the selected warm-paper section, large serif activity title, right-aligned intro, profile/year masthead, green contribution band, five-column typographic ledger, and thin language distribution bar. The live portfolio header remains visible above the section because it is existing product infrastructure rather than part of the selected section mock.

## Focused Region Comparison

The full-view comparison kept the calendar cells, metric typography, rules, and language bar readable enough for focused judgment, so a separate crop was not needed. The mobile capture was reviewed independently because the source visual only specifies desktop composition.

## Required Fidelity Surfaces

- Fonts and typography: Instrument Serif and DM Sans use the Portfolio's existing font tokens and match the selected high-contrast display/sans hierarchy. The title, metric values, labels, and intro preserve the source weight and wrapping intent.
- Spacing and layout rhythm: the final pass reduced section padding and inter-region gaps after the first comparison showed excessive vertical looseness. Desktop now fits the complete section into roughly one 1440 × 1024 viewport; mobile changes the metric ledger to readable label/value rows.
- Colors and visual tokens: warm paper, black ink, blue eyebrow, coral profile underline, restrained green contributions, and real GitHub language colors match the selected direction and existing Portfolio tokens.
- Image quality and asset fidelity: the design contains no raster imagery. The GitHub mark comes from the installed icon library; contribution cells and data bars are native data visualization output rather than simulated assets.
- Copy and content: `GitHub Activity`, the live editorial description, current year, contribution total, five live metrics, profile URL, and language labels are all present. The implementation retains the brief methodology note for statistical clarity.

## Findings

No actionable P0, P1, or P2 mismatch remains.

- P3: the calendar library distributes real rolling-year data slightly differently from the concept's illustrative grid. This is expected because the implementation prioritizes live GitHub data.
- P3: the fixed Portfolio header consumes vertical space that the isolated concept does not show. It is accepted existing product infrastructure.

## Interaction And Responsive QA

- The contribution period control changed to 2025 and displayed 289 contributions, proving the primary interaction works.
- The GitHub profile link resolves to `https://github.com/goyal1510`.
- At 390px, the 1103px calendar remains within a 366px horizontal scroller while the page itself stays at 390px with no document overflow.
- Desktop and mobile browser console checks returned no warnings or errors.
- Loading, ready, and provider-unavailable states remain implemented for live repository statistics.

## Comparison History

1. First comparison: P2 vertical density drift—the calendar and metrics were spaced more loosely than the source, pushing the language distribution below the target viewport. Fixed by reducing section padding, heading/ledger/calendar gaps, and metric/language spacing.
2. Post-fix comparison: the full hierarchy and language bar fit the desktop target, the contribution cells were squared to match the concept, and no actionable P0/P1/P2 difference remained.

## Implementation Checklist

- [x] Match the selected editorial hierarchy and warm-paper surface.
- [x] Preserve live GitHub contribution and repository data.
- [x] Keep the year control and profile link functional.
- [x] Verify desktop and mobile overflow behavior.
- [x] Verify build, types, lint, formatting, and tests.

## Follow-up Polish

- Optional P3: shorten the methodology note further if a future content pass wants a still cleaner closing edge.

final result: passed
