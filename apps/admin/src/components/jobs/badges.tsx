"use client";

import { Sparkles, Flag } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import type {
  JobAiRecommendation,
  JobApplicationStatus,
  JobPriority,
} from "@/lib/types";

export const STATUS_LABELS: Record<JobApplicationStatus, string> = {
  new: "New",
  interested: "Interested",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const STATUS_COLORS: Record<JobApplicationStatus, string> = {
  new: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  interested: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  applied: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  interviewing:
    "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  offer: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  withdrawn: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export const PRIORITY_COLORS: Record<JobPriority, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-amber-500 text-white",
  medium: "bg-blue-500 text-white",
  low: "bg-slate-400 text-white",
};

export const RECOMMENDATION_LABELS: Record<JobAiRecommendation, string> = {
  apply: "Apply",
  apply_with_referral: "Apply (referral preferred)",
  apply_if_time: "Apply if time permits",
  skip: "Skip",
  skip_red_flags: "Skip — red flags",
};

export function ScoreBadge({
  score,
  className,
  size = "md",
}: {
  score: number | null;
  className?: string;
  size?: "sm" | "md";
}) {
  if (score == null) return null;
  const tone =
    score >= 85
      ? "bg-green-600 text-white"
      : score >= 70
        ? "bg-emerald-500 text-white"
        : score >= 60
          ? "bg-amber-500 text-white"
          : score >= 45
            ? "bg-orange-500 text-white"
            : "bg-rose-600 text-white";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md font-bold tabular-nums",
        size === "md" ? "h-10 w-10" : "h-7 w-9 text-xs",
        tone,
        className
      )}
    >
      {score}
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: JobPriority | null }) {
  if (!priority) return null;
  return (
    <Badge className={PRIORITY_COLORS[priority]}>
      <Flag className="mr-1 h-3 w-3" /> {priority}
    </Badge>
  );
}

export function StatusBadge({
  status,
}: {
  status: JobApplicationStatus | null;
}) {
  if (!status) return null;
  return (
    <Badge variant="secondary" className={STATUS_COLORS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function RecommendationBadge({
  recommendation,
}: {
  recommendation: JobAiRecommendation | null;
}) {
  if (!recommendation) return null;
  return (
    <Badge variant="outline" className="text-xs">
      <Sparkles className="mr-1 h-3 w-3" />
      {RECOMMENDATION_LABELS[recommendation]}
    </Badge>
  );
}
