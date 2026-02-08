# Games Hub

Collection of interactive games with AI opponents.

**Live**: [jayantgoyal.com/games](https://jayantgoyal.com/games)

## Games

### Tic Tac Toe
Classic 3x3 grid game with AI opponent using minimax algorithm.
- Unbeatable AI mode
- Winning line animation
- Score tracking

### Connect Four
Drop discs to connect four in a row.
- Column-drop mechanics
- Win detection (horizontal, vertical, diagonal)
- Animated disc falling

### Memory Match
Card matching game with flip animations.
- Multiple difficulty levels (grid sizes)
- Move counter
- Timer tracking
- Smooth flip animations

### Rock Paper Scissors
Classic hand game with animated results.
- Computer random selection
- Win/lose/draw animations
- Score persistence

### Dare X
Party game with random dare challenges.
- Category selection
- Random dare generation
- JSON-based dare database

## Tech Stack

- **React 19** - UI rendering
- **Framer Motion** - Animations
- **Game Logic** - Custom state machines
- **Zustand** - Score persistence

## Files

```
src/
├── app/(protected)/games/
│   ├── page.tsx              # Games hub
│   ├── tic-tac-toe/
│   ├── connect-four/
│   ├── memory-match/
│   ├── rock-paper-scissors/
│   └── dare-x/
├── lib/games/
│   ├── config.ts             # Game configurations
│   └── sound.ts              # Sound effects
└── public/assets/games/      # Game assets
```

## Key Patterns

- **Minimax AI**: Optimal move calculation for Tic Tac Toe
- **State machines**: Game state transitions (playing, won, draw)
- **Animation hooks**: Framer Motion for smooth UX
