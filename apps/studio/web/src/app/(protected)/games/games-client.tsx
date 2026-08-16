"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@jayantgoyal/web-ui/button";
import { Card } from "@jayantgoyal/web-ui/card";
import { cn } from "@jayantgoyal/web-ui/lib/utils";

import {
  GAME_PLAY_FILTERS,
  gameSupportsFilter,
  getGamePlayLabels,
  type GamePlayFilter,
} from "@/lib/games/catalog";
import { GAME_META, type GameSlug } from "@/lib/games/config";
import { GAME_PRESENTATION } from "@/lib/games/presentation";

const filterLabels: Record<GamePlayFilter, string> = {
  solo: "Solo",
  local: "Local",
  online: "Online",
};

const games = (
  Object.entries(GAME_META) as [GameSlug, (typeof GAME_META)[GameSlug]][]
).map(([slug, meta]) => ({
  slug,
  ...meta,
  ...GAME_PRESENTATION[slug],
  playLabels: getGamePlayLabels(slug),
}));

export function GamesClient({
  initialFilter = "all",
}: {
  initialFilter?: GamePlayFilter | "all";
}) {
  const [selectedFilter, setSelectedFilter] = React.useState<
    GamePlayFilter | "all"
  >(initialFilter);
  const visibleGames = React.useMemo(
    () => games.filter((game) => gameSupportsFilter(game.slug, selectedFilter)),
    [selectedFilter],
  );

  const selectFilter = (filter: GamePlayFilter | "all") => {
    setSelectedFilter(filter);
    window.history.replaceState(
      null,
      "",
      filter === "all" ? "/games" : `/games?play=${filter}`,
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <header className="max-w-4xl space-y-3">
        <h1 className="text-balance text-4xl font-semibold leading-none tracking-[-0.045em] sm:text-5xl">
          Game Hub
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Choose how you want to play, then open a game to configure the
          session.
        </p>
      </header>

      <section className="space-y-4" aria-labelledby="game-results">
        <div className="flex flex-col gap-3 border-b border-border/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex flex-wrap gap-2"
            aria-label="Filter games by play mode"
          >
            <Button
              type="button"
              variant={selectedFilter === "all" ? "default" : "outline"}
              aria-pressed={selectedFilter === "all"}
              className="h-11 rounded-full px-5 shadow-none sm:h-9"
              onClick={() => selectFilter("all")}
            >
              All
            </Button>
            {GAME_PLAY_FILTERS.map((filter) => (
              <Button
                key={filter}
                type="button"
                variant={selectedFilter === filter ? "default" : "outline"}
                aria-pressed={selectedFilter === filter}
                className="h-11 rounded-full px-5 shadow-none sm:h-9"
                onClick={() => selectFilter(filter)}
              >
                {filterLabels[filter]}
              </Button>
            ))}
          </div>

          <p
            id="game-results"
            className="font-[family-name:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.14em] text-muted-foreground"
            aria-live="polite"
          >
            {visibleGames.length} {visibleGames.length === 1 ? "game" : "games"}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleGames.map((game) => {
            const Icon = game.icon;

            return (
              <Link
                key={game.slug}
                href={`/games/${game.slug}`}
                aria-label={`Open ${game.name}`}
                onClick={() => window.scrollTo({ top: 0, behavior: "auto" })}
                className="group block h-full rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card
                  className={cn(
                    "flex min-h-[20rem] h-full flex-col overflow-hidden rounded-[1.75rem] p-7 shadow-none transition-transform duration-300 group-hover:-translate-y-1 sm:p-8",
                    game.tone,
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-current/15 bg-white/15 dark:bg-black/10">
                      <Icon className="size-7" />
                    </span>
                    <ArrowUpRight className="size-5 opacity-70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                  </div>

                  <div className="mt-8 space-y-4">
                    <h2 className="text-3xl font-semibold leading-none tracking-[-0.04em]">
                      {game.name}
                    </h2>
                    <p className="text-base leading-7 opacity-85">
                      {game.description}
                    </p>
                  </div>

                  <p className="mt-auto pt-8 font-[family-name:var(--font-ibm-plex-mono)] text-[0.7rem] font-medium uppercase tracking-[0.15em] opacity-85">
                    {game.playLabels.join(" · ")}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
