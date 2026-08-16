"use client";

import { cn } from "@jayantgoyal/web-ui/lib/utils";

import type { JsonObject } from "@/lib/games/online-sessions";
import {
  getLudoTokenCoordinate,
  LUDO_PATH_COORDINATES,
  LUDO_SAFE_GLOBAL_INDICES,
  LUDO_SEATS,
  type LudoSeat,
  type LudoState,
  type LudoToken,
} from "@/lib/games/ludo";

export const LUDO_TOKEN_CLASSES: Record<LudoSeat, string> = {
  P1: "border-red-700 bg-red-500 text-white shadow-red-900/30",
  P2: "border-emerald-700 bg-emerald-500 text-white shadow-emerald-900/30",
  P3: "border-amber-700 bg-amber-400 text-amber-950 shadow-amber-900/30",
  P4: "border-sky-700 bg-sky-500 text-white shadow-sky-900/30",
};

const HOME_CELL_CLASSES: Record<LudoSeat, string> = {
  P1: "border-red-200 bg-red-100/80 dark:border-red-900 dark:bg-red-950/40",
  P2: "border-emerald-200 bg-emerald-100/80 dark:border-emerald-900 dark:bg-emerald-950/40",
  P3: "border-amber-200 bg-amber-100/80 dark:border-amber-900 dark:bg-amber-950/40",
  P4: "border-sky-200 bg-sky-100/80 dark:border-sky-900 dark:bg-sky-950/40",
};

const HOME_PATH_CLASSES: Record<LudoSeat, string> = {
  P1: "border-red-300 bg-red-200 dark:border-red-900 dark:bg-red-950",
  P2: "border-emerald-300 bg-emerald-200 dark:border-emerald-900 dark:bg-emerald-950",
  P3: "border-amber-300 bg-amber-200 dark:border-amber-900 dark:bg-amber-950",
  P4: "border-sky-300 bg-sky-200 dark:border-sky-900 dark:bg-sky-950",
};

/** Convert a board coordinate into the stable map key used by board lookups. */
function coordinateKey(row: number, column: number) {
  return `${row}:${column}`;
}

const HOME_PATH_KEYS = new Map<string, LudoSeat>();
for (const seat of LUDO_SEATS) {
  const coordinates: readonly (readonly [number, number])[] =
    seat === "P1"
      ? [
          [7, 1],
          [7, 2],
          [7, 3],
          [7, 4],
          [7, 5],
        ]
      : seat === "P2"
        ? [
            [1, 7],
            [2, 7],
            [3, 7],
            [4, 7],
            [5, 7],
          ]
        : seat === "P3"
          ? [
              [7, 13],
              [7, 12],
              [7, 11],
              [7, 10],
              [7, 9],
            ]
          : [
              [13, 7],
              [12, 7],
              [11, 7],
              [10, 7],
              [9, 7],
            ];
  for (const [row, column] of coordinates) {
    HOME_PATH_KEYS.set(coordinateKey(row, column), seat);
  }
}

const PATH_KEYS = new Map<string, number>();
LUDO_PATH_COORDINATES.forEach(([row, column], index) => {
  PATH_KEYS.set(coordinateKey(row, column), index);
});

/** Resolve which colored home quadrant contains a board coordinate. */
function getHomeSeat(row: number, column: number): LudoSeat | null {
  if (row <= 5 && column <= 5) return "P1";
  if (row <= 5 && column >= 9) return "P2";
  if (row >= 9 && column >= 9) return "P3";
  if (row >= 9 && column <= 5) return "P4";
  return null;
}

/** Build the visual class for a home, path, safe, center or empty cell. */
function getCellClass(row: number, column: number) {
  const key = coordinateKey(row, column);
  const homeSeat = getHomeSeat(row, column);
  const homePathSeat = HOME_PATH_KEYS.get(key);
  const pathIndex = PATH_KEYS.get(key);

  if (row === 7 && column === 7) {
    return "border-zinc-300 bg-zinc-950 text-white dark:border-zinc-600";
  }
  if (homePathSeat) return HOME_PATH_CLASSES[homePathSeat];
  if (typeof pathIndex === "number") {
    return cn(
      "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900",
      LUDO_SAFE_GLOBAL_INDICES.has(pathIndex) &&
        "ring-2 ring-inset ring-zinc-500",
    );
  }
  if (homeSeat) return HOME_CELL_CLASSES[homeSeat];
  return "border-transparent bg-transparent";
}

/** Group every token by its current coordinate for efficient cell rendering. */
function tokensByCoordinate(tokens: LudoToken[]) {
  const map = new Map<string, LudoToken[]>();
  for (const token of tokens) {
    const [row, column] = getLudoTokenCoordinate(token);
    const key = coordinateKey(row, column);
    const existing = map.get(key) ?? [];
    existing.push(token);
    map.set(key, existing);
  }
  return map;
}

/** Render the interactive 15×15 Ludo board and submit legal token moves. */
export function OnlineLudoBoard({
  state,
  isMyTurn,
  legalTokenIds,
  submittingAction,
  submitAction,
}: {
  state: LudoState;
  isMyTurn: boolean;
  legalTokenIds: string[];
  submittingAction: boolean;
  submitAction: (payload: JsonObject) => Promise<void>;
}) {
  const tokenMap = tokensByCoordinate(state.tokens);

  return (
    <div className="mx-auto grid w-full max-w-[min(92vw,720px)] grid-cols-[repeat(15,minmax(0,1fr))] rounded-2xl border bg-white/60 p-2 shadow-inner dark:bg-black/20">
      {Array.from({ length: 225 }, (_, index) => {
        const row = Math.floor(index / 15);
        const column = index % 15;
        const key = coordinateKey(row, column);
        const tokens = tokenMap.get(key) ?? [];
        const pathIndex = PATH_KEYS.get(key);
        return (
          <div
            key={key}
            className={cn(
              "relative flex aspect-square min-w-0 items-center justify-center border text-[9px]",
              getCellClass(row, column),
            )}
          >
            {typeof pathIndex === "number" &&
              LUDO_SAFE_GLOBAL_INDICES.has(pathIndex) && (
                <span className="absolute left-1 top-0.5 text-[8px] font-semibold text-zinc-500">
                  S
                </span>
              )}
            {row === 7 && column === 7 && (
              <span className="text-[8px] font-bold tracking-widest">HOME</span>
            )}
            <div className="flex flex-wrap items-center justify-center gap-0.5">
              {tokens.map((token) => {
                const canMove =
                  isMyTurn &&
                  legalTokenIds.includes(token.id) &&
                  state.phase === "move";
                return (
                  <button
                    key={token.id}
                    type="button"
                    onClick={() =>
                      void submitAction({ action: "move", tokenId: token.id })
                    }
                    disabled={!canMove || submittingAction}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-black shadow-sm transition sm:h-6 sm:w-6",
                      LUDO_TOKEN_CLASSES[token.seat],
                      canMove &&
                        "scale-110 ring-2 ring-white hover:-translate-y-0.5",
                      !canMove && "disabled:cursor-default",
                    )}
                    aria-label={`token ${token.id}`}
                  >
                    {token.index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
