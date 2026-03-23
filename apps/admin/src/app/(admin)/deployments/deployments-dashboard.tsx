"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
  ExternalLink,
  RotateCcw,
  Rocket,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import {
  listDeployments,
  redeployDeployment,
  rollbackDeployment,
} from "@/lib/vercel-api";
import type {
  VercelDeployment,
  VercelDeploymentState,
  VercelProjectKey,
} from "@/lib/types";

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

export function DeploymentsDashboard() {
  const [project, setProject] = useState<VercelProjectKey>("jg");
  const [deployments, setDeployments] = useState<VercelDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{
    type: "redeploy" | "rollback";
    deployment: VercelDeployment;
  } | null>(null);

  const fetchDeployments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listDeployments(project);
      setDeployments(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch deployments");
    } finally {
      setLoading(false);
    }
  }, [project]);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  async function handleRedeploy(deployment: VercelDeployment) {
    setActionLoading(deployment.uid);
    try {
      await redeployDeployment(
        deployment.uid,
        project,
        deployment.target || "production"
      );
      toast.success("Redeploy triggered");
      setConfirmAction(null);
      fetchDeployments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Redeploy failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRollback(deployment: VercelDeployment) {
    setActionLoading(deployment.uid);
    try {
      await rollbackDeployment(deployment.uid, project);
      toast.success("Rollback triggered");
      setConfirmAction(null);
      fetchDeployments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rollback failed");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Deployments</CardTitle>
            <CardDescription>
              View and manage Vercel deployments
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={project}
              onValueChange={(v) => setProject(v as VercelProjectKey)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jg">Main App</SelectItem>
                <SelectItem value="admin">Admin App</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchDeployments} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : deployments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deployments found</p>
          ) : (
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
                                  title="Open in Vercel"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                setConfirmAction({ type: "redeploy", deployment: d })
                              }
                              disabled={isLoading}
                              title="Redeploy"
                            >
                              {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Rocket className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            {d.state === "READY" && d.target === "production" && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() =>
                                  setConfirmAction({ type: "rollback", deployment: d })
                                }
                                disabled={isLoading}
                                title="Rollback to this deployment"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "redeploy" ? "Redeploy" : "Rollback"} Confirmation
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "redeploy"
                ? `This will create a new deployment based on ${confirmAction.deployment.url || confirmAction.deployment.uid.slice(0, 12)}.`
                : `This will rollback production to ${confirmAction?.deployment.url || confirmAction?.deployment.uid.slice(0, 12)}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
            <Button
              variant={confirmAction?.type === "rollback" ? "destructive" : "default"}
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.type === "redeploy") {
                  handleRedeploy(confirmAction.deployment);
                } else {
                  handleRollback(confirmAction.deployment);
                }
              }}
              disabled={!!actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {confirmAction?.type === "redeploy" ? "Redeploy" : "Rollback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
