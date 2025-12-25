"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function generateCrontab(minute: string, hour: string, day: string, month: string, weekday: string): string {
  return `${minute} ${hour} ${day} ${month} ${weekday}`
}

function describeCrontab(crontab: string): string {
  const [minute, hour, day, month, weekday] = crontab.split(" ")
  
  const parts: string[] = []
  if (minute !== "*") parts.push(`at minute ${minute}`)
  if (hour !== "*") parts.push(`at hour ${hour}`)
  if (day !== "*") parts.push(`on day ${day}`)
  if (month !== "*") parts.push(`in month ${month}`)
  if (weekday !== "*") parts.push(`on weekday ${weekday}`)
  
  return parts.length > 0 ? parts.join(", ") : "Every minute"
}

export default function CrontabGeneratorPage() {
  const tool = getToolByPath("/crontab-generator")
  const [minute, setMinute] = React.useState("*")
  const [hour, setHour] = React.useState("*")
  const [day, setDay] = React.useState("*")
  const [month, setMonth] = React.useState("*")
  const [weekday, setWeekday] = React.useState("*")
  const [crontab, setCrontab] = React.useState("")
  const [description, setDescription] = React.useState("")

  React.useEffect(() => {
    const crontabStr = generateCrontab(minute, hour, day, month, weekday)
    setCrontab(crontabStr)
    setDescription(describeCrontab(crontabStr))
  }, [minute, hour, day, month, weekday])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(crontab)
    toast.success("Crontab copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Cron Schedule</CardTitle>
          <CardDescription>Configure cron expression</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minute">Minute</Label>
              <Input
                id="minute"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                placeholder="*"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hour">Hour</Label>
              <Input
                id="hour"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                placeholder="*"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="day">Day</Label>
              <Input
                id="day"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                placeholder="*"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="*"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekday">Weekday</Label>
              <Input
                id="weekday"
                value={weekday}
                onChange={(e) => setWeekday(e.target.value)}
                placeholder="*"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Crontab Expression</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            value={crontab}
            readOnly
            className="font-mono text-lg text-center"
          />
        </CardContent>
      </Card>
    </div>
  )
}
