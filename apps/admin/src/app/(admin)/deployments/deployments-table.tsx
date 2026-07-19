"use client";

import Link from "next/link";
import {
  Loader2,
  ExternalLink,
  RotateCcw,
  Rocket,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { IconAction } from "@repo/ui/icon-action";
import type { VercelDeployment, VercelDeploymentState } from "@/lib/types";

const stateBadgeVariant: Record<
  VercelDeploymentState,
  "default" | "secondary" | "destructive" | "outline"
> = {
  READY: "default",
  BUILDING: "secondary",
  INITIALIZING: "secondary",
  QUEUED: "outline",
  ERROR: "destructive",
  CANCELED: "outline",
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleString();
}

function formatRelative(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface DeploymentsTableProps {
  deployments: VercelDeployment[];
  actionLoading: string | null;
  onRedeploy: (deployment: VercelDeployment) => void;
  onRollback: (deployment: VercelDeployment) => void;
}

export function DeploymentsTable({
  deployments,
  actionLoading,
  onRedeploy,
  onRollback,
}: DeploymentsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 pr-4 font-medium">Deployment</th>
            <th className="pb-3 pr-4 font-medium">Branch</th>
            <th className="pb-3 pr-4 font-medium">Commit</th>
            <th className="pb-3 pr-4 font-medium">Created</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {deployments.map((d) => {
            const isLoading = actionLoading === d.uid;
            return (
              <tr key={d.uid} className="border-b last:border-0">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={stateBadgeVariant[d.state]}>
                      {d.state}
                    </Badge>
                    {d.target === "production" && (
                      <Badge variant="outline">prod</Badge>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <Link
                    href={`/deployments/${d.uid}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {d.url ? d.url.slice(0, 40) : d.uid.slice(0, 12)}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {d.meta?.githubCommitRef || "—"}
                </td>
                <td className="py-3 pr-4 text-muted-foreground max-w-[200px] truncate">
                  {d.meta?.githubCommitMessage || "—"}
                </td>
                <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap" title={formatDate(d.created)}>
                  {formatRelative(d.created)}
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {d.inspectorUrl && (
                      <Button variant="ghost" size="icon-sm" asChild>
                        <a
                          href={d.inspectorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Open deployment in Vercel"
                          title="Open in Vercel"
                        >
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </Button>
                    )}
                    <IconAction
                      icon={isLoading ? Loader2 : Rocket}
                      iconClassName={isLoading ? "size-3.5 animate-spin" : "size-3.5"}
                      label={`Redeploy ${d.uid.slice(0, 12)}`}
                      variant="ghost"
                      onClick={() => onRedeploy(d)}
                      disabled={isLoading}
                    />
                    {d.state === "READY" && d.target === "production" && (
                      <IconAction
                        icon={RotateCcw}
                        iconClassName="size-3.5"
                        label={`Rollback ${d.uid.slice(0, 12)}`}
                        variant="ghost"
                        onClick={() => onRollback(d)}
                        disabled={isLoading}
                      />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
