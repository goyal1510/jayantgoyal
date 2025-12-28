"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { formatMonth, getPreviousMonth, getNextMonth } from "@/lib/utils/date"
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
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onPreviousMonth}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium min-w-[100px] text-center">
        {formatMonth(currentMonth)}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={onNextMonth}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

