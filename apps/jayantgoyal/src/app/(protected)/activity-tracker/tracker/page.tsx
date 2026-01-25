"use client"

import * as React from "react"
import { ActivityTracker } from "@/components/activity-tracker/activity-tracker"
import { MonthNavigator } from "@/components/activity-tracker/month-navigator"
import { getCurrentMonth, getPreviousMonth, getNextMonth } from "@/lib/activity-tracker/date"

export default function TrackerPage() {
  const [currentMonth, setCurrentMonth] = React.useState<string>(getCurrentMonth())

  const handlePreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth))
  }

  const handleNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Activity Tracker</h1>
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
