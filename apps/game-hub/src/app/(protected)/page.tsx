import Link from "next/link"
import type { ElementType } from "react"
import { ArrowRight, Gamepad2, Grid3X3, HandHeart, Scissors } from "lucide-react"

import { GAME_META } from "@/lib/games"
import { cn } from "@/lib/utils"

const CARD_THEMES: Record<
  keyof typeof GAME_META,
  {
    gradient: string
    icon: ElementType
    accent: string
    accentText: string
    border: string
  }
> = {
  "tic-tac-toe": {
    gradient:
      "from-blue-200/50 via-slate-50 to-white dark:from-blue-500/25 dark:via-slate-900 dark:to-slate-950",
    icon: Grid3X3,
    accent: "bg-blue-100/80 border-blue-200/70 dark:bg-blue-500/10 dark:border-blue-500/30",
    accentText: "text-blue-800 dark:text-blue-50",
    border: "border-slate-200/60 dark:border-slate-800",
  },
  "rock-paper-scissors": {
    gradient:
      "from-purple-200/50 via-slate-50 to-white dark:from-purple-500/25 dark:via-slate-900 dark:to-slate-950",
    icon: Scissors,
    accent:
      "bg-purple-100/80 border-purple-200/70 dark:bg-purple-500/10 dark:border-purple-500/30",
    accentText: "text-purple-800 dark:text-purple-50",
    border: "border-slate-200/60 dark:border-slate-800",
  },
  "dare-x": {
    gradient:
      "from-emerald-200/50 via-slate-50 to-white dark:from-emerald-500/25 dark:via-slate-900 dark:to-slate-950",
    icon: HandHeart,
    accent:
      "bg-emerald-100/80 border-emerald-200/70 dark:bg-emerald-500/10 dark:border-emerald-500/30",
    accentText: "text-emerald-800 dark:text-emerald-50",
    border: "border-slate-200/60 dark:border-slate-800",
  },
}

export default function Page() {
  const cards = Object.entries(GAME_META).map(([slug, meta]) => {
    const theme = CARD_THEMES[slug as keyof typeof GAME_META]
    const modesLabel =
      meta.modes.length === 2
        ? "PvP • Computer"
        : meta.modes[0] === "local_pvp"
          ? "Local PvP"
          : "Computer"
    return {
      slug,
      name: meta.name,
      description: meta.description,
      modesLabel,
      theme,
    }
  })

  return (
    <div className="p-4 space-y-6">


      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.theme.icon
          return (
            <Link
              key={card.slug}
              href={`/${card.slug}`}
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-5 transition hover:shadow-md",
                "bg-gradient-to-br",
                card.theme.gradient,
                card.theme.border
              )}
            >
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.04),transparent_25%)]" />
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs text-slate-700 dark:text-muted-foreground/90">
                      <span className="font-medium">{card.modesLabel}</span>
                    </div>
                    <div className="text-xl font-semibold text-slate-900 dark:text-white drop-shadow-sm">
                      {card.name}
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-200/80">
                      {card.description}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "rounded-full border p-3 text-white/90 shadow-lg",
                      card.theme.accent,
                      card.theme.accentText
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-800 dark:text-slate-200/80">
                  <span className="inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs bg-white/70 text-slate-800 dark:bg-black/20 dark:text-slate-200">
                    Ready to play
                  </span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
