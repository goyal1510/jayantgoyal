"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { formatMonth } from "@/lib/activity-tracker/date"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface MonthNavigatorProps {
  currentMonth: string
  onPreviousMonth: () => void
  onNextMonth: () => void
}

export function MonthNavigator({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
}: MonthNavigatorProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onPreviousMonth}
        aria-label="Previous month"
        className="h-8 w-8 sm:h-9 sm:w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-xs font-medium min-w-[90px] text-center sm:text-sm sm:min-w-[100px]">
        {formatMonth(currentMonth)}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={onNextMonth}
        aria-label="Next month"
        className="h-8 w-8 sm:h-9 sm:w-9"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
