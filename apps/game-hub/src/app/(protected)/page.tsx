import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { GAME_META } from "@/lib/games"
import { cn } from "@/lib/utils"

export default function Page() {
  const displayName = "Player"

  const statCards = Object.entries(GAME_META).map(([slug, meta]) => ({
    slug,
    name: meta.name,
    description: meta.description,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="text-3xl font-semibold tracking-tight">{displayName}</h1>
        <p className="text-muted-foreground text-sm">
          Pick a game to start playing. Everything runs locally—no scores or sessions are stored.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <Link
            key={card.slug}
            href={`/${card.slug}`}
            className={cn(
              "group rounded-lg border bg-card p-4 transition hover:border-primary hover:shadow-sm",
              "flex flex-col gap-3"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-lg font-semibold">{card.name}</div>
                <div className="text-xs text-muted-foreground">{card.description}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
            </div>
            <div className="text-xs text-muted-foreground">Local play • No tracking</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
