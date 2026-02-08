# Currency Calculator

Cash denomination calculator with history tracking.

**Live**: [jayantgoyal.com/calculator](https://jayantgoyal.com/calculator)

## Features

- Calculate cash by denomination (2000, 500, 200, 100, 50, 20, 10, coins)
- Add notes/labels to calculations
- Save calculation history
- Edit and delete saved entries
- Total amount computation
- INR currency formatting

## Tech Stack

- **Supabase Database** - Calculation storage
- **Zustand** - Local state with persistence
- **React 19** - UI rendering

## How It Works

1. User enters quantity for each denomination
2. App calculates total in real-time
3. User can save with a note/label
4. History shows all saved calculations
5. Full CRUD operations on saved entries

## Files

```
src/
├── app/(protected)/calculator/
│   ├── page.tsx              # Calculator landing
│   ├── new/
│   │   ├── page.tsx          # New calculation
│   │   └── client.tsx        # Calculator UI
│   └── history/
│       ├── page.tsx          # History view
│       └── client.tsx        # History list
├── lib/calculator/
│   ├── database.ts           # DB operations
│   └── client-calculations.ts # Client-side logic
└── app/api/calculator/
    ├── route.ts              # List/create
    └── [id]/route.ts         # Get/update/delete
```

## Denominations

```typescript
const denominations = [
  { value: 2000, label: '₹2000' },
  { value: 500,  label: '₹500' },
  { value: 200,  label: '₹200' },
  { value: 100,  label: '₹100' },
  { value: 50,   label: '₹50' },
  { value: 20,   label: '₹20' },
  { value: 10,   label: '₹10' },
  { value: 5,    label: '₹5' },
  { value: 2,    label: '₹2' },
  { value: 1,    label: '₹1' },
];
```
