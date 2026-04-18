# 2026-04-18: Wordle Clone, Typing Speed Test & Calculator PDF Export

## Date
2026-04-18

## App/Area
apps/jayantgoyal — Games Hub + Calculator

## Problem
Adding three new features:
1. PDF export for currency denomination calculator history
2. Wordle clone game in the Game Hub
3. Typing Speed Test game with Supabase history

## Progress

### Feature 1: PDF Export for Calculator
- Status: Complete
- Installed `jspdf` package
- Created `src/lib/calculator/generate-pdf.ts` — generates professional receipt-style PDF
- Added Download PDF button to history detail sheet in `calculations-history.tsx`

### Feature 2: Wordle Clone
- Status: Complete
- Created `src/lib/games/words.ts` — ~750 solution words + ~1500 valid guesses
- Created `src/components/games/Wordle.tsx` — full game with daily/random modes, keyboard, stats
- Created `src/app/(protected)/games/wordle/page.tsx` — route page
- Updated `config.ts`, `hub-config.ts`, games `page.tsx` with wordle + typing-speed entries

### Feature 3: Typing Speed Test
- Status: Complete
- Created `src/lib/typing-test/database.ts` — TypeScript interfaces
- Created `src/lib/games/typing-texts.ts` — 20 curated typing passages
- Created `src/app/api/typing-test/route.ts` — GET (paginated history) + POST (save result)
- Created `src/components/games/TypingSpeedTest.tsx` — full test with WPM/accuracy/timer + history tab
- Created `src/app/(protected)/games/typing-speed/page.tsx` — route page
- Created `supabase/migrations/20260418_create_typing_test.sql` — `game_hub` schema, `typing_speed_results` table, RLS + grants
- Game hub config already updated in Feature 2

## Verification
- `pnpm check-types --filter jg` — passes
- `pnpm lint --filter jg` — passes (0 warnings)
- `pnpm build --filter jg` — passes

## Key Decisions
- PDF generation uses `jspdf` (client-side, no server needed)
- Wordle stats stored in localStorage (no Supabase, keeps it simple)
- Typing Speed history saved to Supabase `game_hub.typing_speed_results` table with RLS + grants
- Both games registered in game hub config alongside existing games
