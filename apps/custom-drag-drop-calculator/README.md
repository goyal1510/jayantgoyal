# Drag & Drop Calculator

Customizable calculator built with Next.js 16, React DnD, and Tailwind.

## Features
- Drag buttons/operators from the component library into your layout; selections persist via Zustand storage.
- Calculator supports standard ops, sign toggle, clear/backspace, and shows recent calculations.
- Light/dark theming powered by `@repo/ui`.

## Run locally
From the repo root:
```bash
pnpm dev --filter customcal
```

## Environment
No required environment variables.

## Notes
- Drag/drop and persistence live in `src/components/DragDropProvider.tsx` and `src/store/useCalculatorStore.ts`.
- Update the available building blocks in `src/components/ComponentLibrary.tsx`; calculator logic is in `src/components/Calculator.tsx`.
