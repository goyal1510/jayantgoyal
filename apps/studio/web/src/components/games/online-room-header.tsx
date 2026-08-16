"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Copy } from "lucide-react";

import { Button } from "@jayant/web-ui/button";
import { CardHeader, CardTitle } from "@jayant/web-ui/card";

import { GAME_META, type GameSlug } from "@/lib/games/config";
import { GAME_PRESENTATION } from "@/lib/games/presentation";

export function OnlineRoomHeader({
  game,
  roomCode,
  status,
  onCopyInvite,
  actions,
}: {
  game: GameSlug;
  roomCode: string;
  status: string;
  onCopyInvite: () => void | Promise<void>;
  actions?: ReactNode;
}) {
  const meta = GAME_META[game];
  const Icon = GAME_PRESENTATION[game].icon;

  return (
    <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/70 p-5 sm:p-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href={`/games/${game}`} aria-label={`Back to ${meta.name}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-border/70 bg-background/65">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
            Online room · {status}
          </p>
          <CardTitle className="mt-1 truncate text-xl tracking-[-0.03em]">
            {meta.name}
          </CardTitle>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden rounded-lg border border-border/70 bg-background/65 px-3 py-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.12em] sm:inline-flex">
          {roomCode}
        </span>
        {actions}
        <Button variant="outline" size="sm" onClick={onCopyInvite}>
          <Copy className="mr-2 size-4" />
          <span className="hidden sm:inline">Copy invite</span>
          <span className="sm:hidden">Copy</span>
        </Button>
      </div>
    </CardHeader>
  );
}
