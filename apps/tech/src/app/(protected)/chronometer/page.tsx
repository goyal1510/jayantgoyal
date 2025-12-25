"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Square } from "lucide-react"

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const milliseconds = Math.floor((ms % 1000) / 10)

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
}

export default function ChronometerPage() {
  const tool = getToolByPath("/chronometer")
  const [time, setTime] = React.useState(0)
  const [running, setRunning] = React.useState(false)
  const [startTime, setStartTime] = React.useState(0)
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTime(Date.now() - startTime)
      }, 10)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [running, startTime])

  const start = () => {
    setStartTime(Date.now() - time)
    setRunning(true)
  }

  const pause = () => {
    setRunning(false)
  }

  const reset = () => {
    setRunning(false)
    setTime(0)
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Chronometer</CardTitle>
          <CardDescription>Time tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-6xl font-mono font-bold">{formatTime(time)}</p>
          </div>
          <div className="flex justify-center gap-2">
            {!running ? (
              <Button onClick={start}>
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            ) : (
              <Button variant="outline" onClick={pause}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            <Button variant="outline" onClick={reset}>
              <Square className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
