# Ludo And Games Dashboard Layout

Date: 2026-06-09
App: `apps/jayantgoyal`
Worktree: `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
Branch: `codex/commercial-product-foundation`

## Problem

Ludo still feels visually unfinished. The dice should not sit beside the board with a separate Roll button; the turn/dice control should live in the center/home area, show the active turn color, and behave as the roll control. Two-player token homes should sit diagonally, three-player Ludo should avoid the awkward four-corner board and use a triangle-like layout direction. The game also needs stronger CSS motion. The Games dashboard active/history sections should move away from card-heavy presentation toward table-style rows.

## Plan

- Inspect current Ludo board/state and games dashboard implementation.
- Move local Ludo roll control into the board center and remove the separate Roll button.
- Make the center/home area show active turn color and dice state.
- Improve two-player/three-player board presentation and add polished CSS motion.
- Convert active/history dashboard presentation from repeated cards into denser table/list rows.
- Verify with lint/type checks and browser UI checks.

## Proof Ledger

- Session started in the existing implementation worktree after prior direct push to `main`.
- Implemented local-only Ludo seating so two-player games use diagonal Red/Yellow homes and three-player games use a Red/Green/Blue triangle layout without changing online room seat generation.
- Moved the local Ludo dice/roll action into the center of the board, colored by current turn, and removed the separate Roll button from the board footer.
- Aligned the online Ludo room board with the centered dice control and visual-only diagonal/triangle seat mapping while keeping persisted online seat IDs unchanged.
- Reworked active game rooms and recent game history on the Games dashboard into table-style rows instead of card grids.
- `pnpm lint` passed.
- `pnpm check-types` passed.
- Browser validation on `http://localhost:3000/games/ludo` with `test1@jayantgoyal.com` confirmed the setup page, centered Red dice control, diagonal two-player Red/Yellow homes, working center-roll interaction, and three-player Red/Green/Blue corner layout.
- Browser validation on `http://localhost:3000/games` confirmed active game rooms render as a table-style row list.
