# Game Start Flow

Date: 2026-06-09
App: `apps/jayantgoyal`
Worktree: `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
Branch: `codex/commercial-product-foundation`

## Problem

The current game time controls start too early, as soon as the route or game view loads. The intended product behavior is a clear pre-game setup screen for every game where the player chooses names, time, player/computer options, and difficulty before the actual match starts.

## Plan

- Audit every current game route/component and identify where timers, player names, computer mode, and reset state live.
- Create a shared setup-first pattern that keeps timers paused until an explicit `Start game` action.
- Apply it across the game set with game-specific settings: names, timers, computer/human mode, difficulty, and reset/back-to-settings behavior where applicable.
- Keep UI stable on desktop and mobile, with clear primary actions and no timer countdown before start.
- Verify with lint, type check, and browser checks on representative games.

## Proof Ledger

- Orientation: continue in the existing implementation worktree, not the protected source clone.
- Plan: created `docs/plan/game-start-flow-plan.md` with the setup-first contract, implementation phases, and verification targets.
- Shared UI: added `game-setup-shell.tsx` to provide a consistent setup-first card with a single explicit `Start game` action.
- Rock Paper Scissors: added a setup-first screen for player name, round limit, difficulty, and online room controls. The countdown now only runs after `Start game`, and `Setup` returns to configuration.
- Chess: added a setup-first screen for mode, player names, computer strength, game clock, and online room controls. Both chess clocks and computer moves are gated behind `Start game`.
- Tic Tac Toe hook: added explicit `gameStarted` state so timer and moves cannot activate from route load or by closing setup without starting.
- Connect Four hook: added explicit `gameStarted` state so the board and turn timer stay inert until `Start game`.
- Tic Tac Toe UI: route now opens on a setup screen for mode, names, turn limit, and online room controls before rendering the board.
- Tic Tac Toe active game: board cells remain disabled unless `gameStarted` is true, and the in-game turn picker is locked so timer choices happen from setup.
- Connect Four UI: route now opens on a setup screen for mode, names, turn limit, and online room controls; active-board time choices are locked after start.
- Memory Match: added a setup-first screen for mode, grid difficulty, names, and online room controls before cards are dealt.
- Ludo: added setup-first screen for mode, player count, finish target, and online room controls; rolls, token moves, and computer turns are gated behind `Start game`.
- Wordle: converted the initial daily/random choice into the shared setup shell with one explicit `Start game` action.
- Typing Speed hook: added `startTest()` and changed input handling so typing cannot start the countdown unless the explicit start action has already run.
- Typing Speed UI: added setup-first screen for duration and text preview; stats, progress, and typing textarea only render once the test has started or completed.
- Dare X: added setup-first screen with mode, player/dare summary, online controls, and an advanced setup sheet; dare generation still requires explicit `Start game`.
- Name preservation: updated Tic Tac Toe, Connect Four, and Memory Match session starts so custom setup names are trimmed and preserved instead of being overwritten by defaults.
- Static verification: `pnpm lint`, `pnpm check-types`, and `git diff --check` passed after the setup-first game changes.
- Browser verification: RPS route opened on setup with no round timer; clicking `Start game` rendered the active game and the round timer began. Chess route opened on setup with no white/black clock cards; clicking `Start game` rendered the board and active clocks.
- Browser route sweep: Tic Tac Toe, Connect Four, Memory Match, Ludo, Wordle, Typing Speed, and Dare X all rendered setup-first screens with explicit start actions. Ludo and Dare X needed a second settled read after route compilation, then both verified.
- Mobile browser verification: representative setup screens for RPS, Chess, Ludo, and Typing Speed at `390px` width had `scrollWidth` equal to `clientWidth` and no horizontal overflow offenders.
- Final verification: reran `pnpm lint`, `pnpm check-types`, and `git diff --check`; all passed after proof documentation updates.
- Pre-ship cleanup: removed leftover Connect Four debug `console.log` calls found by the focused security/cleanup scan.
- Pre-ship validation: `pnpm lint`, `pnpm check-types`, `pnpm build --filter jg`, `pnpm build --filter admin`, focused secret/debug scan, and `git diff --check` passed before staging. A parallel typecheck/build run briefly hit a transient `.next/types/cache-life.d.ts` race; rerunning typecheck after build passed.
