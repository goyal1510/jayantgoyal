"use client";

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import type { JobApplication, JobApplicationStatus } from "@/lib/types";

const COLUMNS: Array<{ status: JobApplicationStatus; label: string; color: string }> = [
  { status: "interested", label: "Interested", color: "border-blue-300" },
  { status: "applied", label: "Applied", color: "border-amber-300" },
  { status: "interviewing", label: "Interviewing", color: "border-purple-300" },
  { status: "offer", label: "Offer", color: "border-green-300" },
  { status: "rejected", label: "Rejected", color: "border-red-300" },
];

export function PipelineClient({ initialData }: { initialData: JobApplication[] }) {
  const grouped = useMemo(() => {
    const map = new Map<JobApplicationStatus, JobApplication[]>();
    for (const c of COLUMNS) map.set(c.status, []);
    for (const a of initialData) {
      const arr = map.get(a.status);
      if (arr) arr.push(a);
    }
    return map;
  }, [initialData]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          {initialData.length} tracked applications
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        {COLUMNS.map((col) => {
          const items = grouped.get(col.status) ?? [];
          return (
            <div key={col.status} className={`rounded-lg border-t-2 ${col.color} bg-muted/30 p-3`}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{col.label}</h2>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">No items</p>
                ) : (
                  items.map((a) => (
                    <Card key={a.id}>
                      <CardContent className="space-y-1 p-3">
                        <div className="text-sm font-medium leading-tight">{a.title}</div>
                        <div className="text-xs text-muted-foreground">{a.company}</div>
                        {a.next_action_note && (
                          <div className="text-xs text-amber-600 dark:text-amber-400">
                            {a.next_action_note}
                          </div>
                        )}
                        {a.apply_url && (
                          <a
                            href={a.apply_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Open <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
