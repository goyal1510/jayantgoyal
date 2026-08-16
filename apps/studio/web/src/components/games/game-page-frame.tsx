import type { ReactNode } from "react";

import { WorkspaceHeader } from "@jayantgoyal/web-ui/workspace-header";
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
      <WorkspaceHeader
        icon={Icon}
        title={meta.name}
        description={meta.description}
        toneClassName={presentation.tone}
        details={
          <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[0.7rem] font-medium uppercase tracking-[0.16em] opacity-80">
            {getGamePlayLabels(game).join(" · ")}
          </p>
        }
      />

      {children}
    </article>
  );
}
