"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Github, ChevronDown, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Button } from "@repo/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu"

const GitHubCalendar = dynamic(
  () => import("react-github-calendar").then((mod) => ({ default: mod.GitHubCalendar })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading contribution data...</div>
      </div>
    ),
  }
)

type YearOption = number | "last"

interface ContributionCalendarProps {
  username: string
}

export function ContributionCalendar({ username }: ContributionCalendarProps) {
  const currentYear = new Date().getFullYear()
  const { resolvedTheme } = useTheme()
  const [selectedYear, setSelectedYear] = useState<YearOption>("last")

  const yearOptions = useMemo(() => {
    const years: YearOption[] = ["last"]
    for (let year = currentYear; year >= currentYear - 4; year--) {
      years.push(year)
    }
    return years
  }, [currentYear])

  const getYearLabel = (year: YearOption): string => {
    if (year === "last") return "Last Year"
    return year.toString()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Github className="size-5 text-primary" />
              Contribution Calendar
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {getYearLabel(selectedYear)}
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[120px]">
                {yearOptions.map((year) => (
                  <DropdownMenuItem
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className="flex cursor-pointer items-center justify-between"
                  >
                    <span>{getYearLabel(year)}</span>
                    {selectedYear === year && <Check className="size-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <motion.div
            key={`${username}-${selectedYear}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full overflow-x-auto overflow-y-hidden pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex justify-center" style={{ minWidth: "max-content" }}>
              <GitHubCalendar
                username={username}
                year={selectedYear}
                colorScheme={resolvedTheme === "dark" ? "dark" : "light"}
                blockSize={14}
                blockMargin={4}
                fontSize={14}
                showWeekdayLabels
                weekStart={1}
              />
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
