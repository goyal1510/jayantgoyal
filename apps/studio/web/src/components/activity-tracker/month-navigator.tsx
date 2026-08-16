"use client";

import * as React from "react";
import { Button } from "@jayantgoyal/web-ui/button";
import { formatMonth } from "@/lib/activity-tracker/date";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthNavigatorProps {
  currentMonth: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export function MonthNavigator({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
}: MonthNavigatorProps) {
  return (
    <div className="flex h-11 items-center gap-1 rounded-xl border border-current/15 bg-white/25 p-1 text-current dark:bg-black/10">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPreviousMonth}
        aria-label="Previous month"
        className="size-8 rounded-lg text-current hover:bg-white/35 hover:text-current dark:hover:bg-black/20"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[90px] text-center text-xs font-medium sm:min-w-[100px] sm:text-sm">
        {formatMonth(currentMonth)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onNextMonth}
        aria-label="Next month"
        className="size-8 rounded-lg text-current hover:bg-white/35 hover:text-current dark:hover:bg-black/20"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
