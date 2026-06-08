"use client"

import * as React from "react"
import { Clock3 } from "lucide-react"

import { Button } from "@repo/ui/button"
import { cn } from "@repo/ui/lib/utils"

export type TimeControlPreset = {
  id: string
  label: string
  seconds: number
  description: string
}

export const TURN_TIME_PRESETS: TimeControlPreset[] = [
  { id: "rapid", label: "5:00", seconds: 300, description: "Full game clock" },
  { id: "blitz", label: "3:00", seconds: 180, description: "Fast game clock" },
  { id: "bullet", label: "1:00", seconds: 60, description: "Pressure game clock" },
]

export const ROUND_TIME_PRESETS: TimeControlPreset[] = [
  { id: "quick", label: "5s", seconds: 5, description: "Quick reaction" },
  { id: "normal", label: "10s", seconds: 10, description: "Default round" },
  { id: "thinking", label: "20s", seconds: 20, description: "Thinking round" },
]

export function formatGameTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) return `${seconds}s`

  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function useGameCountdown({
  durationSeconds,
  active,
  resetKey,
  onExpire,
}: {
  durationSeconds: number
  active: boolean
  resetKey: string | number
  onExpire: () => void
}) {
  const durationMs = durationSeconds * 1000
  const [remainingMs, setRemainingMs] = React.useState(durationMs)
  const expiredRef = React.useRef(false)
  const onExpireRef = React.useRef(onExpire)

  React.useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  React.useEffect(() => {
    expiredRef.current = false
    setRemainingMs(durationMs)
  }, [durationMs, resetKey])

  React.useEffect(() => {
    if (!active || expiredRef.current) return

    let lastTick = Date.now()
    const intervalId = window.setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastTick
      lastTick = now

      setRemainingMs((current) => {
        const next = Math.max(0, current - elapsed)

        if (next === 0 && !expiredRef.current) {
          expiredRef.current = true
          window.setTimeout(() => onExpireRef.current(), 0)
        }

        return next
      })
    }, 250)

    return () => window.clearInterval(intervalId)
  }, [active])

  return {
    remainingMs,
    isExpired: remainingMs <= 0,
  }
}

export function TimeControlPicker({
  label,
  presets,
  valueSeconds,
  onChange,
  disabled,
}: {
  label: string
  presets: TimeControlPreset[]
  valueSeconds: number
  onChange: (seconds: number) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Clock3 className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant={valueSeconds === preset.seconds ? "secondary" : "outline"}
            className="h-auto flex-col gap-1 py-2"
            onClick={() => onChange(preset.seconds)}
            disabled={disabled}
            title={preset.description}
          >
            <span className="font-mono text-sm">{preset.label}</span>
            <span className="text-[10px] font-normal text-muted-foreground">
              {preset.description}
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}

export function GameClockCard({
  label,
  remainingMs,
  active,
  expired,
  helper,
  tone = "neutral",
}: {
  label: string
  remainingMs: number
  active?: boolean
  expired?: boolean
  helper?: string
  tone?: "neutral" | "blue" | "amber" | "emerald" | "rose"
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-3 transition",
        active && "border-foreground/40 shadow-sm",
        expired && "border-destructive bg-destructive/10",
        tone === "blue" && active && "bg-blue-500/10",
        tone === "amber" && active && "bg-amber-500/10",
        tone === "emerald" && active && "bg-emerald-500/10",
        tone === "rose" && active && "bg-rose-500/10"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          {helper && <div className="truncate text-xs text-muted-foreground">{helper}</div>}
        </div>
        {active && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold tabular-nums">
        {formatGameTime(remainingMs)}
      </div>
    </div>
  )
}
