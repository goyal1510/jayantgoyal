import type { ComponentType } from "react";
import {
  Brain,
  Crown,
  Dice5,
  Grid3X3,
  HandHeart,
  Layers,
  Puzzle,
  Scissors,
  Type,
} from "lucide-react";

import type { GameSlug } from "@/lib/games/config";

export const GAME_PRESENTATION: Record<
  GameSlug,
  {
    icon: ComponentType<{ className?: string; strokeWidth?: number }>;
    tone: string;
  }
> = {
  "rock-paper-scissors": {
    icon: Scissors,
    tone: "border-[#cfc0e4] bg-[#e8dcf5] text-[#211512] dark:border-[#5c5068] dark:bg-[#2f2938] dark:text-[#fff8ef]",
  },
  "tic-tac-toe": {
    icon: Grid3X3,
    tone: "border-[#d93328] bg-[#ff5a4f] text-[#211512]",
  },
  "dare-x": {
    icon: HandHeart,
    tone: "border-[#bdc4a3] bg-[#d9ddc3] text-[#211512] dark:border-[#4b594b] dark:bg-[#29312a] dark:text-[#fff8ef]",
  },
  "connect-four": {
    icon: Layers,
    tone: "border-[#ddcfbb] bg-[#f2e2c8] text-[#211512] dark:border-[#5e554c] dark:bg-[#332d28] dark:text-[#fff8ef]",
  },
  "memory-match": {
    icon: Brain,
    tone: "border-border/80 bg-card text-card-foreground dark:bg-[#202124] dark:text-[#fff8ef]",
  },
  wordle: {
    icon: Puzzle,
    tone: "border-[#bdc4a3] bg-[#d9ddc3] text-[#211512] dark:border-[#4b594b] dark:bg-[#29312a] dark:text-[#fff8ef]",
  },
  "typing-speed": {
    icon: Type,
    tone: "border-[#cfc0e4] bg-[#e8dcf5] text-[#211512] dark:border-[#5c5068] dark:bg-[#2f2938] dark:text-[#fff8ef]",
  },
  chess: {
    icon: Crown,
    tone: "border-border/80 bg-card text-card-foreground dark:bg-[#202124] dark:text-[#fff8ef]",
  },
  ludo: {
    icon: Dice5,
    tone: "border-[#d93328] bg-[#ff5a4f] text-[#211512]",
  },
};
