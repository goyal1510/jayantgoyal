"use client";

import { History } from "lucide-react";

import { Button } from "@jayantgoyal/web-ui/button";
import { Card, CardContent } from "@jayantgoyal/web-ui/card";
import { PageSpinner } from "@jayantgoyal/web-ui/page-spinner";
import type { TypingTestResult } from "@/lib/typing-test/database";

interface TypingSpeedHistoryProps {
  results: TypingTestResult[];
  historyLoading: boolean;
  historyLoaded: boolean;
  historyPage: number;
  totalPages: number;
  bestWPM: number;
  avgWPM: number;
  avgAccuracy: number;
  loadHistory: (page: number) => void;
}

export function TypingSpeedHistory({
  results,
  historyLoading,
  historyLoaded,
  historyPage,
  totalPages,
  bestWPM,
  avgWPM,
  avgAccuracy,
  loadHistory,
}: TypingSpeedHistoryProps) {
  if (historyLoading && !historyLoaded) {
    return <PageSpinner />;
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <History className="mx-auto mb-4 h-12 w-12 opacity-60" />
          <p className="text-base font-medium">No results yet</p>
          <p className="text-sm">
            Complete a typing test to see your history here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">Best WPM</div>
            <div className="text-2xl font-bold text-emerald-600">{bestWPM}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">Avg WPM</div>
            <div className="text-2xl font-bold">{avgWPM}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">Avg Accuracy</div>
            <div className="text-2xl font-bold">{avgAccuracy}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-muted/70">
                <tr className="text-left">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5 text-center">WPM</th>
                  <th className="px-4 py-2.5 text-center">Accuracy</th>
                  <th className="px-4 py-2.5 text-center">Duration</th>
                  <th className="px-4 py-2.5 text-center">Chars</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b transition hover:bg-muted/40"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A"}
                    </td>
                    <td className="px-4 py-2.5 text-center font-semibold text-emerald-600">
                      {r.wpm}
                    </td>
                    <td className="px-4 py-2.5 text-center">{r.accuracy}%</td>
                    <td className="px-4 py-2.5 text-center">
                      {r.duration_seconds}s
                    </td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">
                      {r.correct_characters}/{r.total_characters}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={historyPage <= 1 || historyLoading}
            onClick={() => loadHistory(historyPage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {historyPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={historyPage >= totalPages || historyLoading}
            onClick={() => loadHistory(historyPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}
