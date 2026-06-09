"use client"

import type { ReactNode } from "react"
import { Play, Settings2 } from "lucide-react"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { cn } from "@repo/ui/lib/utils"

export function GameSetupShell({
  title,
  description,
  children,
  onStart,
  startLabel = "Start game",
  disabled,
  className,
}: {
  title: string
  description: string
  children: ReactNode
  onStart: () => void
  startLabel?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <Card
      className={cn(
        "mx-auto max-w-3xl overflow-hidden border-foreground/10 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_34%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--muted)/0.38))]",
        className
      )}
    >
      <CardHeader className="space-y-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Settings2 className="h-3.5 w-3.5" />
          Setup
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {children}
        <Button type="button" size="lg" className="w-full" onClick={onStart} disabled={disabled}>
          <Play className="mr-2 h-4 w-4" />
          {startLabel}
        </Button>
      </CardContent>
    </Card>
  )
}
