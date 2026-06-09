# Game Start Flow Plan

Date: 2026-06-09
Worktree: `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
Branch: `codex/commercial-product-foundation`

## Problem

Game routes should not begin a match, timer, round, or computer action just because the user opened the game page. Every local game needs an explicit setup-first flow where player names, mode, difficulty, and time limits are chosen before the actual play surface becomes active.

## Product Contract

- Opening a game route shows setup/readiness first.
- Timers remain parked at their configured duration until `Start game`.
- Board/action controls are disabled or hidden until the match starts.
- `Setup` or `New setup` returns the player to configuration and clears active match state.
- Online room creation/join stays available from setup but does not start local timers.
- Games without timers still use the same start boundary so the route load never feels like an implicit game start.

## Phases

1. Done: Add a reusable game setup shell for consistent pre-game presentation.
2. Done: Gate timed games: Rock Paper Scissors, Chess, Tic Tac Toe, Connect Four, Typing Speed.
3. Done: Gate board/action games without existing timer pressure: Ludo, Memory Match, Wordle, Dare X.
4. Done: Move time-control choices into setup where possible and lock them during active play.
5. Done: Verify with lint, type check, and browser checks:
   - RPS: route shows setup, timer not active, Start game reveals choices and timer.
   - Chess: route shows setup, clocks do not tick before Start game.
   - Tic Tac Toe/Connect Four: closing setup cannot accidentally start timer.
   - Ludo/Memory/Wordle/Dare X: route opens setup/readiness, game actions require Start.

## Current Scope

Implement the local game route behavior. Online room pages already have room/session state and are not the first target for this local setup problem.

## Verification Result

- `pnpm lint` passed.
- `pnpm check-types` passed.
- `git diff --check` passed.
- Browser verified setup-first routes for RPS, chess, tic tac toe, connect four, memory match, ludo, wordle, typing speed, and dare x.
- Browser verified RPS and chess timers/clocks only appear after `Start game`.
- Mobile browser verified representative setup screens at `390px` width with no horizontal overflow.
