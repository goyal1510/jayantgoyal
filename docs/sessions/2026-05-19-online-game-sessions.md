# 2026-05-19 Online Game Sessions

## Area

`apps/jayantgoyal` game hub, Supabase schema, and online multiplayer/session foundations.

## Problem

The existing games are local/client-oriented. The goal is to add a reusable online session structure so games can be played from different locations through shareable rooms.

## Plan

- Inspect current game routes, hooks, Supabase schema, and app API patterns.
- Add a conservative Supabase migration for game rooms, players, moves, and results with RLS.
- Add typed app-side foundations that can support Connect Four first, then other turn-based games.
- Keep game simulation state serializable and separate from UI/rendering concerns.

## Notes

- Start with React-based turn games; no Phaser/3D runtime is needed for the current game set.
- Prefer authenticated ownership for persistence, with room-code joins designed so guest support can be layered in later.

## Progress

- Verified Supabase CLI is linked to `orwfvyditlguqvxvztkw` and can query the live `jg_app` schema.
- Created `20260518224119_online_game_sessions.sql` via `supabase migration new`.
- Added the first online session schema: sessions, participants, moves, results, indexes, RLS, grants, and realtime publication entries.
- Added reusable online-session types/helpers and server bundle helpers.
- Added authenticated API foundations for creating rooms, joining by room code, loading a joined room, and recording generic moves.
- Marked Connect Four as the first `onlineReady` game in metadata.
- Applied the migration to the linked Supabase project with `supabase db push --linked --yes`; verified the four new tables and migration history entry exist.
- Verified RLS is enabled on all four new game-session tables in the linked database.
- Installed workspace dependencies from the existing lockfile so local checks could run.
- Targeted ESLint on the new game-session API/lib files passed with zero warnings.
- Full `pnpm --filter jg check-types` is currently blocked by pre-existing Supabase MFA typing errors in auth routes.
- Full `pnpm --filter jg lint` is currently blocked by pre-existing blog `<img>` warnings.
- `supabase db advisors --linked --type security --level warn --fail-on error` passed without new errors; it reports existing warning-level findings around older mutable-search-path functions, executable security-definer functions, and leaked-password protection.
- Exported reusable Connect Four simulation helpers so online state can use the same board creation, winner, and full-board logic as local play.
- Added `OnlineConnectFourRoom` and `/games/connect-four/room/[roomCode]` for authenticated online rooms, room joining, realtime refresh, turn gating, and move recording.
- Added create-room and join-by-code controls to the existing Connect Four setup sheet.
- Validated the online flow with `agent-browser` in two isolated sessions: red user created room `EREM6M`, yellow user joined from the room link, moves alternated, realtime turn gating updated both sessions, and red completed a vertical win.
- Verified the persisted Supabase result before cleanup: `status=completed`, `outcome=win`, `winner=R`, `move_count=7`.
- Deleted the temporary Supabase Auth test users after validation and closed browser sessions.
- Attempted to refresh the tracked `supabase/schemas/jg_app.sql` dump, but Supabase CLI requires Docker for `db dump` and Docker was not running; restored the file after the failed dump touched it.
- Added `chess.js` to the main app so Chess uses a proven rules engine for legal moves, FEN, PGN, checkmate, and draw state.
- Created `20260518230505_add_chess_game_slug.sql` to allow `chess` in `jg_app.game_hub_sessions.game_slug`.
- Applied the Chess slug migration to the linked Supabase project after dry-run confirmed it was the only pending migration.
- Added Chess to game metadata, the game hub card themes, sidebar navigation, and online-session slug/seat helpers.
- Added shared Chess helpers and a local Chess page component using `chess.js`, unicode pieces, legal-move highlighting, status, reset, and online room create/join controls.
- Updated session creation to persist an optional initial state and added a dedicated Chess move API that validates turn ownership and legal moves server-side with `chess.js`.
- Added the protected Chess route plus the online Chess room route/component with authenticated join, realtime refresh, invite copying, turn gating, last-move highlighting, board orientation by side, and server-submitted legal moves.
- Hardened local and API Chess move handling after verifying `chess.js` throws for illegal moves rather than returning `null`.
- Targeted ESLint passed for the Chess component, online room, Chess API, session helpers, and new Chess routes.
- Full `pnpm --filter jg check-types` remains blocked by the pre-existing Supabase MFA typing errors in `api/account/mfa-cleanup` and `auth/callback`.
- Validated online Chess with two isolated `agent-browser --session` browser sessions in room `Y7248B`: white created the room, black joined, the browsers played `f3`, `...e5`, `g4`, `...Qh4#`, and the board locked after completion.
- Verified the persisted Supabase Chess result: `status=completed`, `outcome=win`, winner seat `B`, final state `checkmate`, and four recorded moves.
- Deleted the temporary Chess validation users after testing; the test rooms were removed by the auth/user cascade. Closed browser sessions and stopped the local dev server.
- Re-ran full app lint; it is still blocked only by the existing blog `<img>` warnings in `blog-content.tsx`. The targeted game/API ESLint command passes.
- Started the next conversion with Tic Tac Toe because it fits the shared turn-based online session model cleanly.
- Added shared Tic Tac Toe rules/state helpers, a dedicated server-validated Tic Tac Toe move API, an online room UI/route, and create/join controls in the existing Tic Tac Toe setup sheet.
- Targeted ESLint passed for the Tic Tac Toe component, online room, shared rules, dedicated move API, and online room page.
- Validated online Tic Tac Toe with two isolated `agent-browser --session` browser sessions in room `4237BK`: X created the room, O joined, moves played `X:1`, `O:4`, `X:2`, `O:5`, `X:3`, and X won across the top row.
- Verified the persisted Supabase Tic Tac Toe result: `status=completed`, `outcome=win`, winner seat `X`, winning line `[0,1,2]`, and five recorded moves.
- Deleted the temporary Tic Tac Toe validation users after testing; the test room was removed by the auth/user cascade. Closed browser sessions and stopped the local dev server.
- Checked route metadata/discoverability conventions after adding Chess and Tic Tac Toe room routes. Breadcrumb and JSON-LD generation already handle nested game routes generically; added Chess to the sitemap game list.
- Fixed a TypeScript narrowing issue in the Tic Tac Toe move API found by the broad app type check.
- Re-ran the broad app type check after the fix; the only remaining failures are the pre-existing Supabase MFA/auth callback typing errors.
- Started the Rock Paper Scissors conversion with a simultaneous-choice model: each player submits a hidden choice for the round, the server reveals/scales scores after both choices, and first to three wins completes the room.
- Added shared Rock Paper Scissors state/rules helpers, a dedicated server-validated choice API, and marked Rock Paper Scissors as online-ready in game metadata.
- Added the Rock Paper Scissors online room UI/route and create/join controls on the existing local Rock Paper Scissors screen.
- Targeted ESLint passed for the Rock Paper Scissors component, online room, shared rules, dedicated move API, and online room page.
- Broad app type check still reports only the existing Supabase MFA/auth callback typing errors.
- Validated online Rock Paper Scissors with two isolated `agent-browser --session` browser sessions in room `KM5CCC`: P1 created the room, P2 joined, P1 chose rock and P2 chose scissors for three rounds, and P1 completed a 3-0 first-to-three win.
- Verified the persisted Supabase Rock Paper Scissors result: `status=completed`, `outcome=win`, winner seat `P1`, scores `{P1:3,P2:0,draws:0}`, and six recorded choices.
- Deleted the temporary Rock Paper Scissors validation users after testing; the test room was removed by the auth/user cascade. Closed browser sessions and stopped the local dev server.
- Final targeted ESLint pass across all new game-session APIs, helpers, online room components, game pages, and sitemap passed with zero warnings.
- Started Dare X online conversion. Added dynamic Dare X room sizing in session creation, shared Dare X online state helpers, and a server-owned Dare X action API for getting/resolving dares with turn rotation and completion handling.
- Added the Dare X online room UI/route, create/join controls in the existing Dare X page, and marked Dare X as online-ready in game metadata.
- Broad app type check after the Dare X changes still reports only the pre-existing Supabase MFA/auth callback typing errors. Fixed a targeted Dare X lint warning by displaying the computed room status in the player panel.
- Targeted ESLint passed for the Dare X page, online room, shared online state helpers, dynamic session sizing, and server action API.
- Validated online Dare X with two isolated `agent-browser --session` browser sessions in room `XBDH96`: P1 created a 2-player room, P2 joined, turns rotated after get-dare/done actions, and the room completed after the configured six turns.
- Verified the persisted Supabase Dare X result before cleanup: `status=completed`, `outcome=draw`, `totalTurns=6`, `historyLength=6`, and twelve recorded actions.
- Deleted the temporary Dare X validation users after testing; the test room was removed by the auth/user cascade. Closed browser sessions and stopped the local dev server.
- Started Memory Match online conversion. Added shared Memory Match state/rules helpers as the foundation for a server-validated online room.
- Added the dedicated Memory Match flip API. It authenticates the caller, verifies room membership, enforces the current seat, validates card IDs and selected-card state, records each flip, rotates turns on misses, keeps the same player on matches, and completes the room when all pairs are matched.
- Added the Memory Match online room UI and route with realtime refresh, join flow, invite copying, turn gating, score/move display, and responsive card grid sizing by difficulty.
- Added Memory Match create-room and join-by-code controls to the existing setup sheet and marked Memory Match as online-ready in game metadata.
- Targeted ESLint passed for the Memory Match local component, online room component, shared rules helper, dedicated flip API, and online room page.
- Broad app type check remains blocked only by the pre-existing Supabase MFA/auth callback typing errors in `api/account/mfa-cleanup` and `auth/callback`.
- Validated online Memory Match with two isolated `agent-browser --session` browser sessions in room `22692Q`: P1 created an easy room, P2 joined from the room link, server-side turn gating worked, a miss rotated the turn, P2 completed all three pairs, and the room locked after completion.
- Verified the persisted Supabase Memory Match result before cleanup: `status=completed`, `outcome=win`, winner seat `P2`, scores `{P1:0,P2:3}`, all six cards matched, and eight recorded flips.
- Deleted the temporary Memory Match validation users after testing; the test room was removed by the auth/user cascade. Closed browser sessions and stopped the local dev server.
- Started Wordle online conversion. Added shared Wordle challenge state/evaluation helpers and a server-only deterministic solution helper that derives the answer from the room session ID without exposing the secret word in the client-visible room state.
- Added a dedicated Wordle guess API. It authenticates the caller, verifies room membership, validates words against the existing word list, evaluates guesses server-side, tracks each player's independent guess lane, and completes the room on first solve or a draw when both players run out.
- Added the Wordle online room UI and route with two visible guess lanes, realtime refresh, join flow, invite copying, completion answer reveal, and first-solver-wins challenge status.
- Added Wordle create-room and join-by-code controls to the existing Wordle start screen and marked Wordle as online-ready in game metadata.
- Targeted ESLint passed for the Wordle local component, online room component, shared helpers, server-only solution helper, dedicated guess API, and online room page. A broad type check caught a Wordle result typing issue, which was fixed by narrowing the completed-room solution to a string before rendering.
- Re-ran targeted ESLint after the Wordle typing fix; it passed with zero warnings.
- Broad app type check after the Wordle typing fix remains blocked only by the pre-existing Supabase MFA/auth callback typing errors in `api/account/mfa-cleanup` and `auth/callback`.
- Validated online Wordle with two isolated `agent-browser --session` browser sessions in room `YM886C`: P1 created the challenge, P2 joined from the room link, both players could submit independent guesses, and P2 solved the shared hidden answer on their second guess.
- Verified the persisted Supabase Wordle result before cleanup: `status=completed`, `outcome=win`, winner seat `P2`, solution `realm`, P1 guesses `about`/`raise`, and P2 guesses `block`/`realm`.
- Deleted the temporary Wordle validation users after testing; the test room was removed by the auth/user cascade. Closed browser sessions and stopped the local dev server.
- Started Ludo as a new online-first game. Created the Supabase migration shell with `supabase migration new add_ludo_game_slug`, filled the `game_slug` check-constraint update for `ludo`, added Ludo to online-session slug helpers, enabled 2-4 player room sizing, and wired Ludo into game metadata, sidebar navigation, and sitemap entries.
- Added shared Ludo rules/state helpers and a dedicated server-owned Ludo action API. The server now validates membership and turns, rolls dice on the server, rejects illegal token moves, handles yard entry on six, exact-finish movement, safe-square capture prevention, opponent captures, extra turns, and completed-room result writes.
- Added the Ludo start route and create/join screen with 2-4 player room creation, quick/classic finish targets, and a visual four-home board preview. Added a Ludo card theme to the game hub grid.
- Added the online Ludo room route and UI with a 15x15 Ludo board, colored homes, track cells, safe-square markers, home paths, realtime refresh, join flow, invite copying, turn-gated dice rolling, legal-token highlighting, player home counts, and completed-room winner display.
- Fixed the first Ludo lint/type-check pass issues: removed an unused room import, narrowed generated home-path coordinate tuples, used an arbitrary 15-column Tailwind grid class, typed parsed active seats as `LudoSeat[]`, and kept dice values non-null when applying server rolls.
- Targeted ESLint passed for Ludo components, routes, rules helper, action API, online-session helpers, game metadata, hub config, games page, and sitemap. Broad app type check remains blocked only by the pre-existing Supabase MFA/auth callback typing errors.
- Dry-ran the linked Supabase migration push and confirmed only `20260519000300_add_ludo_game_slug.sql` was pending, then applied it successfully to the linked project.
- Validated online Ludo with two isolated `agent-browser --session` browser sessions in room `48ULDZ`: P1 created a two-player quick room, P2 joined from the room link, the board rendered with colored homes/track/safe squares, P1 performed a real server dice roll that persisted as a no-move skip, and a legal browser token move completed the quick target.
- Verified the persisted Supabase Ludo result before cleanup: `status=completed`, `outcome=win`, winner seat `P1`, target token `P1-1` finished at progress `57`, and two recorded Ludo actions. Captured visual QA screenshot at `/tmp/ludo-validation/screenshot-1779149856146.png`.
- Deleted the temporary Ludo validation users after testing; the test room was removed by the auth/user cascade. Closed browser sessions and stopped the local dev server. Re-ran targeted ESLint after validation and it passed with zero warnings.
