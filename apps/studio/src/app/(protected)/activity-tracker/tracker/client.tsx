"use client"

import * as React from "react"
import { ActivityTracker } from "@/components/activity-tracker/activity-tracker"
import { MonthNavigator } from "@/components/activity-tracker/month-navigator"
import { getCurrentMonth, getPreviousMonth, getNextMonth } from "@/lib/activity-tracker/date"

export default function TrackerClient() {
  const [currentMonth, setCurrentMonth] = React.useState<string>(getCurrentMonth())

  const handlePreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth))
  }

  const handleNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth))
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold tracking-tight sm:text-2xl md:text-3xl">Tracker</h1>
        <MonthNavigator
          currentMonth={currentMonth}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />
      </div>
      <ActivityTracker currentMonth={currentMonth} />
    </div>
  )
}
