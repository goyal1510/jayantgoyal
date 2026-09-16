"use client";

import Link from "next/link";

import { Badge } from "@jayantgoyal/web-ui/badge";
import { Button } from "@jayantgoyal/web-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";

type BoardReportsPanelProps = {
  boardId: string;
  boardKey: string;
  reports: {
    completion: Record<string, unknown>;
    backlog: Record<string, unknown>;
    staleCards: Array<Record<string, unknown>>;
  };
  compact?: boolean;
};

export function BoardReportsPanel({
  boardId,
  boardKey,
  reports,
  compact = false,
}: BoardReportsPanelProps) {
  const completedCount = Number(reports.completion.completed_count ?? 0);
  const averageAge = Number(reports.backlog.average_age_days ?? 0);
  const staleCards = reports.staleCards;

  return (
    <div className="space-y-6">
      {!compact ? (
        <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-background to-background p-4 sm:p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {boardKey}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Board reports</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Completion velocity, backlog age, and stale-card visibility for the last 30 days.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed (30d)</CardDescription>
            <CardTitle className="text-3xl">{completedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {(reports.completion.definition as string) ?? "Cards completed in the period."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average backlog age</CardDescription>
            <CardTitle className="text-3xl">{averageAge}d</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {(reports.backlog.definition as string) ?? "Average age of active cards."}
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription>Stale cards (14d+)</CardDescription>
            <CardTitle className="text-3xl">{staleCards.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Active cards without updates in the last 14 days.
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Stale cards</h2>
          <Badge variant="outline">{staleCards.length} tracked</Badge>
        </div>
        {staleCards.length > 0 ? (
          <ul className="divide-y rounded-md border">
            {staleCards.map((card) => (
              <li
                key={String(card.id)}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {boardKey}-{String(card.number)}
                  </span>
                  <span className="ml-2 font-medium">{String(card.title)}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  Updated {new Date(String(card.updated_at)).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No stale cards in the last 14 days.</p>
        )}
      </section>

      {compact ? (
        <Button variant="outline" asChild>
          <Link href={`/boards/${boardId}/reports`}>Open full reports</Link>
        </Button>
      ) : null}
    </div>
  );
}
