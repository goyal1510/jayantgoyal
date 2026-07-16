# Custom Calculator

Drag-and-drop calculator builder with customizable button layouts.

**Live**: [studio.jayantgoyal.com/custom-calculator](https://studio.jayantgoyal.com/custom-calculator)

## Features

- Drag and drop buttons to customize layout
- Add/remove calculator buttons
- Custom operators and functions
- Layout persistence across sessions
- Reset to default layout
- Fully functional calculator operations

## Tech Stack

- **React DnD** - Drag and drop functionality
- **Zustand** - State management with persistence
- **React 19** - UI rendering

## How It Works

1. Calculator starts with default button layout
2. Users can drag buttons to rearrange positions
3. Add new buttons from available pool
4. Remove unwanted buttons
5. Layout saved to localStorage automatically
6. Calculator remains fully functional throughout

## Files

```
src/
├── app/(protected)/custom-calculator/
│   ├── page.tsx              # Server component
│   └── client.tsx            # Calculator builder UI
└── lib/custom-calculator/
    ├── types.ts              # TypeScript types
    └── useCalculatorStore.ts # Zustand store
```

## Key Patterns

- **React DnD**: HTML5 backend for drag operations
- **Zustand persist**: Layout saved to localStorage
- **skipHydration**: Manual hydration to avoid SSR mismatch

## Store Structure

```typescript
interface CalculatorStore {
  layout: ButtonConfig[];
  availableButtons: ButtonConfig[];
  moveButton: (from: number, to: number) => void;
  addButton: (button: ButtonConfig) => void;
  removeButton: (id: string) => void;
  resetLayout: () => void;
}
```
