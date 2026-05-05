"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Loader2, Clock } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Card, CardContent } from "@repo/ui/card";
import { Switch } from "@repo/ui/switch";
import { toggleSource } from "@/lib/jobs-api";
import type { JobSource } from "@/lib/types";

function timeAgo(iso: string | null) {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function SourcesClient({ initialData }: { initialData: JobSource[] }) {
  const [sources, setSources] = useState(initialData);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleToggle(s: JobSource, next: boolean) {
    setBusyId(s.id);
    try {
      const r = await toggleSource(s.id, next);
      setSources((prev) => prev.map((p) => (p.id === s.id ? r.data : p)));
      toast.success(next ? "Source activated" : "Source paused");
    } catch {
      toast.error("Failed to toggle source");
    } finally {
      setBusyId(null);
    }
  }

  const totalActive = sources.filter((s) => s.is_active).length;
  const totalListings = sources.reduce((acc, s) => acc + (s.last_fetch_count ?? 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Job Sources</h1>
        <p className="text-sm text-muted-foreground">
          {totalActive} of {sources.length} active · {totalListings.toLocaleString()} listings on last fetch
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Run <code className="rounded bg-muted px-1.5 py-0.5">node scripts/jobs/ingest.mjs</code> to refresh manually,
          or wait for the daily cron.
        </p>
      </div>

      <div className="space-y-2">
        {sources.map((s) => (
          <Card key={s.id} className={!s.is_active ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.label}</span>
                    <Badge variant="secondary">{s.kind}</Badge>
                    {s.last_fetch_status === "ok" && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    {s.last_fetch_status === "error" && (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {timeAgo(s.last_fetched_at)}
                    </span>
                    {s.last_fetch_count != null && (
                      <span>{s.last_fetch_count} listings</span>
                    )}
                    {s.last_fetch_error && (
                      <span className="text-red-600">{s.last_fetch_error.slice(0, 100)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {busyId === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Switch
                      checked={s.is_active}
                      onCheckedChange={(v) => handleToggle(s, v)}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
