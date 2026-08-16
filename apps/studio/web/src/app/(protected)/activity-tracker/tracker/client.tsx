"use client";

import * as React from "react";
import { ActivityTracker } from "@/components/activity-tracker/activity-tracker";
import { MonthNavigator } from "@/components/activity-tracker/month-navigator";
import {
  getCurrentMonth,
  getPreviousMonth,
  getNextMonth,
} from "@/lib/activity-tracker/date";
import { CalendarCheck2 } from "lucide-react";
import { WorkspaceHeader } from "@jayant/web-ui/workspace-header";

export default function TrackerClient() {
  const [currentMonth, setCurrentMonth] =
    React.useState<string>(getCurrentMonth());

  const handlePreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth));
  };

  const handleNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth));
  };

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
      <WorkspaceHeader
        icon={CalendarCheck2}
        title="Monthly tracker"
        description="Check off today and the previous two days while keeping the full month visible for context."
        tone="sage"
        actions={
          <MonthNavigator
            currentMonth={currentMonth}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />
        }
      />
      <ActivityTracker currentMonth={currentMonth} />
    </div>
  );
}
