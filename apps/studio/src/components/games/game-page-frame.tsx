import type { ReactNode } from "react";

import { cn } from "@repo/ui/lib/utils";

import { getGamePlayLabels } from "@/lib/games/catalog";
import { GAME_META, type GameSlug } from "@/lib/games/config";
import { GAME_PRESENTATION } from "@/lib/games/presentation";

export function GamePageFrame({
  game,
  children,
}: {
  game: GameSlug;
  children: ReactNode;
}) {
  const meta = GAME_META[game];
  const presentation = GAME_PRESENTATION[game];
  const Icon = presentation.icon;

  return (
    <article className="mx-auto w-full max-w-[1280px] space-y-6">
      <header
        className={cn(
          "overflow-hidden rounded-[1.75rem] border p-6 sm:p-8 lg:p-9",
          presentation.tone,
        )}
      >
        <div className="max-w-4xl space-y-5">
          <span className="grid size-14 place-items-center rounded-2xl border border-current/15 bg-white/15 dark:bg-black/10">
            <Icon className="size-7" strokeWidth={1.7} />
          </span>
          <div className="space-y-3">
            <h1 className="text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {meta.name}
            </h1>
            <p className="max-w-3xl text-base leading-7 opacity-85 sm:text-lg sm:leading-8">
              {meta.description}
            </p>
          </div>
          <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[0.7rem] font-medium uppercase tracking-[0.16em] opacity-80">
            {getGamePlayLabels(game).join(" · ")}
          </p>
        </div>
      </header>

      {children}
    </article>
  );
}
