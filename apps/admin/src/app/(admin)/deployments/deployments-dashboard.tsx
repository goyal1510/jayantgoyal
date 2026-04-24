"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@repo/ui/button";
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
  listDeployments,
  redeployDeployment,
  rollbackDeployment,
} from "@/lib/vercel-api";
import type { VercelDeployment, VercelProjectKey } from "@/lib/types";
import { DeploymentsTable } from "./deployments-table";
import { ConfirmActionDialog } from "./confirm-action-dialog";

export function DeploymentsDashboard() {
  const [project, setProject] = useState<VercelProjectKey>("jg");
  const [deployments, setDeployments] = useState<VercelDeployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  async function handleConfirm() {
    if (!confirmAction) return;
    const { type, deployment } = confirmAction;

    setActionLoading(deployment.uid);
    try {
      if (type === "redeploy") {
        await redeployDeployment(deployment.uid, project, deployment.target || "production");
        toast.success("Redeploy triggered");
      } else {
        await rollbackDeployment(deployment.uid, project);
        toast.success("Rollback triggered");
      }
      setConfirmAction(null);
      fetchDeployments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${type} failed`);
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
            <DeploymentsTable
              deployments={deployments}
              actionLoading={actionLoading}
              onRedeploy={(d) => setConfirmAction({ type: "redeploy", deployment: d })}
              onRollback={(d) => setConfirmAction({ type: "rollback", deployment: d })}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        action={confirmAction?.type ?? null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        loading={!!actionLoading}
        deploymentLabel={confirmAction?.deployment.url || confirmAction?.deployment.uid.slice(0, 12) || ""}
      />
    </div>
  );
}
