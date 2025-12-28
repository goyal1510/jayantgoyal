"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ActivityStats as ActivityStatsType } from "@/lib/types/database"
import { toast } from "sonner"

interface StatsResponse {
  stats: ActivityStatsType[]
  overall: {
    total_activities: number
    total_days: number
    total_completed_days: number
    unique_completed_days?: number
    overall_completion_rate: number
  }
}

interface ActivityStatsProps {
  currentMonth: string
}

export function ActivityStats({ currentMonth }: ActivityStatsProps) {
  const [stats, setStats] = React.useState<ActivityStatsType[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let isMounted = true

    const loadStats = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/activities/stats?month=${currentMonth}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Failed to load stats.")
        }

        const data = (await response.json()) as StatsResponse

        if (!isMounted) return

        setStats(data.stats || [])
      } catch {
        if (!isMounted) return
        toast.error("Unable to load activity stats.")
      } finally {
        if (!isMounted) return
        setIsLoading(false)
      }
    }

    void loadStats()

    return () => {
      isMounted = false
    }
  }, [currentMonth])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (stats.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">
            No activities yet. Create activities using the "Add Activity" button above to see your performance metrics here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Activity Stats Table */}
      <Card>
        <CardContent className="p-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Activity</TableHead>
                  <TableHead className="text-center">Completed Days</TableHead>
                  <TableHead className="text-center">Completion Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat) => (
                  <TableRow key={stat.activity_id}>
                    <TableCell className="font-medium">
                      {stat.activity_name}
                    </TableCell>
                    <TableCell className="text-center">
                      {stat.completed_days} / {stat.total_days}
                    </TableCell>
                    <TableCell className="text-center">
                      {stat.completion_rate.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
