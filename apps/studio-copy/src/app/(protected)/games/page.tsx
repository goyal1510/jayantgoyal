import type { Metadata } from "next";

import { GamesClient } from "./games-client";

import { GAME_PLAY_FILTERS, type GamePlayFilter } from "@/lib/games/catalog";

export const metadata: Metadata = {
  title: "Game Hub",
  description:
    "Play interactive games — Tic Tac Toe, Connect Four, Memory Match, Wordle, Chess, Ludo, and more.",
};

type GamesPageProps = {
  searchParams: Promise<{ play?: string | string[] }>;
};

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const { play } = await searchParams;
  const requestedFilter = Array.isArray(play) ? play[0] : play;
  const initialFilter = GAME_PLAY_FILTERS.includes(
    requestedFilter as GamePlayFilter,
  )
    ? (requestedFilter as GamePlayFilter)
    : "all";

  return <GamesClient initialFilter={initialFilter} />;
}
