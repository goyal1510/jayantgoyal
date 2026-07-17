"use client";

import * as React from "react";
import { PageSpinner } from "@repo/ui/page-spinner";
import { Progress } from "@/components/ui/progress";
import { ActivityStats as ActivityStatsType } from "@/lib/activity-tracker/database";
import { toast } from "sonner";

interface StatsResponse {
  stats: ActivityStatsType[];
  overall: {
    total_activities: number;
    total_days: number;
    total_completed_days: number;
    unique_completed_days?: number;
    overall_completion_rate: number;
  };
}

interface ActivityStatsProps {
  currentMonth: string;
}

export function ActivityStats({ currentMonth }: ActivityStatsProps) {
  const [stats, setStats] = React.useState<ActivityStatsType[]>([]);
  const [overall, setOverall] = React.useState<StatsResponse["overall"] | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/activity-tracker/stats?month=${currentMonth}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load stats.");
        }

        const data = (await response.json()) as StatsResponse;

        if (!isMounted) return;

        setStats(data.stats || []);
        setOverall(data.overall);
      } catch {
        if (!isMounted) return;
        toast.error("Unable to load activity stats.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadStats();

    return () => {
      isMounted = false;
    };
  }, [currentMonth]);

  if (isLoading) {
    return <PageSpinner />;
  }

  if (stats.length === 0) {
    return (
      <section className="rounded-[1.75rem] border border-border/80 bg-card">
        <div className="flex flex-col items-center justify-center px-6 py-12">
          <p className="text-muted-foreground text-center">
            No activities yet. Create activities using the &ldquo;Add
            Activity&rdquo; button above to see your performance metrics here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card sm:grid sm:grid-cols-3">
        {[
          ["Active routines", overall?.total_activities ?? stats.length],
          ["Completed check-ins", overall?.total_completed_days ?? 0],
          [
            "Overall completion",
            `${(overall?.overall_completion_rate ?? 0).toFixed(1)}%`,
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="border-b border-border/70 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
          >
            <p className="text-3xl font-semibold tracking-[-0.045em]">
              {value}
            </p>
            <p className="mt-1 font-[family-name:var(--font-ibm-plex-mono)] text-[0.66rem] uppercase tracking-[0.13em] text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border border-border/80 bg-card">
        <div className="border-b border-border/70 p-5 sm:p-6">
          <h2 className="text-2xl font-semibold tracking-[-0.035em]">
            Routine progress
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Completion for the selected month.
          </p>
        </div>
        <div className="divide-y divide-border/70">
          {stats.map((stat) => (
            <div
              key={stat.activity_id}
              className="grid gap-3 p-5 sm:grid-cols-[180px_minmax(0,1fr)_120px] sm:items-center sm:px-6"
            >
              <p className="font-medium">{stat.activity_name}</p>
              <Progress value={stat.completion_rate} className="h-2.5" />
              <div className="text-left sm:text-right">
                <p className="font-semibold">
                  {stat.completion_rate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {stat.completed_days} of {stat.total_days} days
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
