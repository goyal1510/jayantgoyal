"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import {
  getDeployment,
  getBuildLogs,
  redeployDeployment,
  rollbackDeployment,
} from "@/lib/vercel-api";
import type {
  VercelDeploymentDetail as DeploymentDetailType,
  VercelBuildLogEntry,
  VercelDeploymentState,
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

interface DeploymentDetailProps {
  deploymentId: string;
}

export function DeploymentDetail({ deploymentId }: DeploymentDetailProps) {
  const [deployment, setDeployment] = useState<DeploymentDetailType | null>(null);
  const [logs, setLogs] = useState<VercelBuildLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"redeploy" | "rollback" | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDeployment(deploymentId);
      setDeployment(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch deployment");
    } finally {
      setLoading(false);
    }
  }, [deploymentId]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await getBuildLogs(deploymentId);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch build logs");
    } finally {
      setLogsLoading(false);
    }
  }, [deploymentId]);

  useEffect(() => {
    fetchDetail();
    fetchLogs();
  }, [fetchDetail, fetchLogs]);

  async function handleRedeploy() {
    if (!deployment) return;
    setActionLoading(true);
    try {
      // Determine project from the deployment name
      const project = deployment.name?.includes("admin") ? "admin" as const : "jg" as const;
      await redeployDeployment(
        deployment.uid,
        project,
        deployment.target || "production"
      );
      toast.success("Redeploy triggered");
      setConfirmAction(null);
      fetchDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Redeploy failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRollback() {
    if (!deployment) return;
    setActionLoading(true);
    try {
      const project = deployment.name?.includes("admin") ? "admin" as const : "jg" as const;
      await rollbackDeployment(deployment.uid, project);
      toast.success("Rollback triggered");
      setConfirmAction(null);
      fetchDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rollback failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/deployments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deployments
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Deployment not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/deployments">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Deployments
        </Link>
      </Button>

      {/* Deployment Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Badge variant={stateBadgeVariant[deployment.readyState || deployment.state]}>
                {deployment.readyState || deployment.state}
              </Badge>
              {deployment.target === "production" && (
                <Badge variant="outline">production</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {deployment.url}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {deployment.inspectorUrl && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={deployment.inspectorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Vercel
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmAction("redeploy")}
              disabled={actionLoading}
            >
              <Rocket className="h-4 w-4 mr-2" />
              Redeploy
            </Button>
            {deployment.state === "READY" && deployment.target === "production" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmAction("rollback")}
                disabled={actionLoading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Rollback
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Deployment ID</span>
              <p className="font-mono text-xs mt-0.5">{deployment.uid}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created</span>
              <p className="mt-0.5">{formatDate(deployment.created)}</p>
            </div>
            {deployment.ready && (
              <div>
                <span className="text-muted-foreground">Ready</span>
                <p className="mt-0.5">{formatDate(deployment.ready)}</p>
              </div>
            )}
            {deployment.meta?.githubCommitRef && (
              <div>
                <span className="text-muted-foreground">Branch</span>
                <p className="mt-0.5">{deployment.meta.githubCommitRef}</p>
              </div>
            )}
            {deployment.meta?.githubCommitSha && (
              <div>
                <span className="text-muted-foreground">Commit</span>
                <p className="font-mono text-xs mt-0.5">
                  {deployment.meta.githubCommitSha.slice(0, 7)}
                </p>
              </div>
            )}
            {deployment.meta?.githubCommitMessage && (
              <div className="md:col-span-2">
                <span className="text-muted-foreground">Commit Message</span>
                <p className="mt-0.5">{deployment.meta.githubCommitMessage}</p>
              </div>
            )}
            {deployment.meta?.githubCommitAuthorName && (
              <div>
                <span className="text-muted-foreground">Author</span>
                <p className="mt-0.5">{deployment.meta.githubCommitAuthorName}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Build Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Build Logs</CardTitle>
            <CardDescription>Output from the build process</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={logsLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${logsLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {logsLoading && logs.length === 0 ? (
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

      {/* Confirmation Dialog */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "redeploy" ? "Redeploy" : "Rollback"} Confirmation
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "redeploy"
                ? `This will create a new deployment based on ${deployment.url}.`
                : `This will rollback production to ${deployment.url}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === "rollback" ? "destructive" : "default"}
              onClick={confirmAction === "redeploy" ? handleRedeploy : handleRollback}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {confirmAction === "redeploy" ? "Redeploy" : "Rollback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
