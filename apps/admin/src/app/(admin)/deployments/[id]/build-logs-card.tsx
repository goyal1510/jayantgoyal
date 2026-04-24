"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import type { VercelBuildLogEntry } from "@/lib/types";

interface BuildLogsCardProps {
  logs: VercelBuildLogEntry[];
  loading: boolean;
  onRefresh: () => void;
}

export function BuildLogsCard({ logs, loading, onRefresh }: BuildLogsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Build Logs</CardTitle>
          <CardDescription>Output from the build process</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No build logs available</p>
        ) : (
          <div className="bg-muted/50 rounded-md p-4 max-h-[500px] overflow-y-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap break-all">
              {logs.map((log, i) => (
                <span
                  key={i}
                  className={
                    log.type === "stderr"
                      ? "text-red-500"
                      : log.type === "command"
                        ? "text-blue-500"
                        : ""
                  }
                >
                  {log.payload}
                  {"\n"}
                </span>
              ))}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
