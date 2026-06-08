# 2026-06-08 Game Time Controls

## Scope

Add a reusable time-control foundation for games in `apps/jayantgoyal`, starting with games where timing materially changes play: Rock Paper Scissors, Chess, and then nearby turn-based games that can share the same timer model.

## Execution Plan

1. Audit current game components and online room state shapes for timer insertion points.
2. Add a shared client-side game clock utility/component for countdowns, turn clocks, labels, presets, pause/reset, and timeout callbacks.
3. Integrate time controls into Chess with per-side clocks and timeout loss.
4. Integrate time controls into Rock Paper Scissors with round decision countdowns and timeout behavior.
5. Extend the same foundation to at least one more turn-based game if the abstraction holds cleanly.
6. Validate with lint/type checks and browser smoke tests.

## Decisions

- Worktree: `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Branch: `codex/game-time-controls`
- Keep the first implementation local/client-side unless persistence is necessary. Existing online session state already has JSON settings/state, so database migrations should not be needed for the first pass.

## Progress

- Created a fresh worktree from `origin/main` for the time-control work and copied local environment files without printing secret values.
- Audited the current local game components. Chess, Rock Paper Scissors, and Tic Tac Toe each owned local game state directly and had no shared timer abstractions, making them good first targets for a reusable foundation.
- Added `game-time-controls.tsx` with shared timer presets, time formatting, a countdown hook, a time-control picker, and a compact game clock card.
- Wired local Chess to use per-side clocks with timeout wins and preset game-clock selection.
- Wired local Rock Paper Scissors to use a round countdown that auto-picks a move when time expires.
- Wired local Tic Tac Toe to use a per-turn countdown and timeout win, with the hook exposing the current symbol so the timer can resolve the winner cleanly.
- Cleaned up the first timer diff before validation by removing a duplicated Chess board `disabled` prop and simplifying the RPS round handler so the countdown hook always uses the latest expire callback.
- Extended the same turn-timer foundation to Connect Four. The clock pauses while discs animate or the computer is processing, then resumes for the next decision; timeout awards the win to the other color.
- Validation passes after the local timer foundation: `pnpm --filter jg lint`, `pnpm --filter jg check-types`, and `git diff --check`.
- Browser QA with `test1@jayantgoyal.com` confirmed Chess clock text/countdown renders, Rock Paper Scissors 5-second timeout auto-picks and records a round result, Tic Tac Toe shows the per-turn clock after starting a game, and Connect Four shows the per-turn clock after starting a game.
- Started the game-feel polish pass after feedback that Chess, RPS, and Ludo still feel boring and the Chess board squares visually fluctuate. Stabilized Chess squares with fixed grid rows/columns, aspect-square cells, centered piece layers, and non-resizing last-move highlights. Added lightweight hover/selection/result motion to RPS and legal/last-move/dice feedback to Ludo.
- Validation after the game-feel polish passes: `pnpm --filter jg lint`, `pnpm --filter jg check-types`, and `git diff --check`. Browser QA confirmed all 64 Chess squares remain a single stable size (`67x67`) before and after a real `e4 d5` move sequence, RPS shows selected-choice motion/ring and result state after play, and Ludo legal tokens render with the bounce animation after a controlled six roll.
- Adjusted the Ludo board visual model after feedback that the full 15x15 visible grid made the UI look like too many blocks. The board now uses soft colored quadrant panels for home areas, circular token slots only at actual yard positions, and rounded track/home-path cells only where movement happens, while preserving the same token coordinates and game logic.
- First validation after the Ludo visual-board refactor caught only one cleanup: the old `getHomeSeat` helper became unused after home quadrants moved to panel overlays, so it was removed.
- Browser QA after the Ludo board refactor confirmed `/games/ludo` renders for `test1@jayantgoyal.com`, keeps the Roll/status controls and all 8 token buttons for the default two-player game, and reduces visible bordered board cells from the full construction grid to the actual track/home/slot surfaces.
