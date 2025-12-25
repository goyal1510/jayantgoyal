"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function calculateETA(startTime: Date, currentProgress: number, totalProgress: number): {
  elapsed: number
  remaining: number
  eta: Date
  speed: number
} {
  const elapsed = Date.now() - startTime.getTime()
  const progress = currentProgress / totalProgress
  const remaining = progress > 0 ? elapsed / progress - elapsed : 0
  const eta = new Date(Date.now() + remaining)
  const speed = elapsed > 0 ? currentProgress / (elapsed / 1000) : 0

  return { elapsed, remaining, eta, speed }
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export default function ETACalculatorPage() {
  const tool = getToolByPath("/calculators/eta-calculator")
  const [startTime, setStartTime] = React.useState(new Date())
  const [currentProgress, setCurrentProgress] = React.useState(0)
  const [totalProgress, setTotalProgress] = React.useState(100)
  const [eta, setEta] = React.useState<ReturnType<typeof calculateETA> | null>(null)

  React.useEffect(() => {
    if (currentProgress > 0 && totalProgress > 0 && currentProgress <= totalProgress) {
      const result = calculateETA(startTime, currentProgress, totalProgress)
      setEta(result)
    } else {
      setEta(null)
    }
  }, [startTime, currentProgress, totalProgress])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Progress Information</CardTitle>
          <CardDescription>Enter progress details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current Progress</Label>
              <Input
                id="current"
                type="number"
                value={currentProgress}
                onChange={(e) => setCurrentProgress(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total">Total Progress</Label>
              <Input
                id="total"
                type="number"
                value={totalProgress}
                onChange={(e) => setTotalProgress(Math.max(1, parseFloat(e.target.value) || 1))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="start">Start Time</Label>
            <Input
              id="start"
              type="datetime-local"
              value={startTime.toISOString().slice(0, 16)}
              onChange={(e) => setStartTime(new Date(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {eta && (
        <Card>
          <CardHeader>
            <CardTitle>ETA Calculation</CardTitle>
            <CardDescription>Estimated time remaining</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Elapsed Time</Label>
                <p className="font-semibold">{formatTime(eta.elapsed)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Remaining Time</Label>
                <p className="font-semibold">{formatTime(eta.remaining)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">ETA</Label>
                <p className="font-semibold">{eta.eta.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Speed</Label>
                <p className="font-semibold">{eta.speed.toFixed(2)} units/sec</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
