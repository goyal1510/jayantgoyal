"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  ExternalLink,
  ArrowLeft,
  RotateCcw,
  Rocket,
} from "lucide-react";
import { Button } from "@jayantgoyal/web-ui/button";
import { Badge } from "@jayantgoyal/web-ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";
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
import { BuildLogsCard } from "./build-logs-card";
import { ConfirmActionDialog } from "../confirm-action-dialog";

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
  canManage: boolean;
}

export function DeploymentDetail({
  deploymentId,
  canManage,
}: DeploymentDetailProps) {
  const [deployment, setDeployment] = useState<DeploymentDetailType | null>(
    null,
  );
  const [logs, setLogs] = useState<VercelBuildLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "redeploy" | "rollback" | null
  >(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDeployment(deploymentId);
      setDeployment(data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to fetch deployment",
      );
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
      toast.error(
        err instanceof Error ? err.message : "Failed to fetch build logs",
      );
    } finally {
      setLogsLoading(false);
    }
  }, [deploymentId]);

  useEffect(() => {
    fetchDetail();
    fetchLogs();
  }, [fetchDetail, fetchLogs]);

  async function handleAction() {
    if (!deployment || !confirmAction) return;
    setActionLoading(true);
    try {
      const project = deployment.name?.includes("admin")
        ? ("admin" as const)
        : ("studio" as const);
      if (confirmAction === "redeploy") {
        await redeployDeployment(
          deployment.uid,
          project,
          deployment.target || "production",
        );
        toast.success("Redeploy triggered");
      } else {
        await rollbackDeployment(deployment.uid, project);
        toast.success("Rollback triggered");
      }
      setConfirmAction(null);
      fetchDetail();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `${confirmAction} failed`,
      );
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Badge
                variant={
                  stateBadgeVariant[deployment.readyState || deployment.state]
                }
              >
                {deployment.readyState || deployment.state}
              </Badge>
              {deployment.target === "production" && (
                <Badge variant="outline">production</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">{deployment.url}</CardDescription>
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
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction("redeploy")}
                disabled={actionLoading}
              >
                <Rocket className="h-4 w-4 mr-2" />
                Redeploy
              </Button>
            )}
            {canManage &&
              deployment.state === "READY" &&
              deployment.target === "production" && (
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
                <p className="mt-0.5">
                  {deployment.meta.githubCommitAuthorName}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <BuildLogsCard logs={logs} loading={logsLoading} onRefresh={fetchLogs} />

      {canManage && (
        <ConfirmActionDialog
          action={confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleAction}
          loading={actionLoading}
          deploymentLabel={deployment.url}
        />
      )}
    </div>
  );
}
