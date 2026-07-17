import { GAME_META, type GameSlug } from "@/lib/games/config";

export const GAME_PLAY_FILTERS = ["solo", "local", "online"] as const;

export type GamePlayFilter = (typeof GAME_PLAY_FILTERS)[number];

export function gameSupportsFilter(
  slug: GameSlug,
  filter: GamePlayFilter | "all",
) {
  if (filter === "all") return true;

  const game = GAME_META[slug];
  if (filter === "solo") return game.modes.includes("vs_computer");
  if (filter === "local") return game.modes.includes("local_pvp");
  return game.onlineReady === true;
}

export function getGamePlayLabels(slug: GameSlug) {
  const labels: string[] = [];

  if (gameSupportsFilter(slug, "solo")) labels.push("Solo");
  if (gameSupportsFilter(slug, "local")) labels.push("Local");
  if (gameSupportsFilter(slug, "online")) labels.push("Online");

  return labels;
}
