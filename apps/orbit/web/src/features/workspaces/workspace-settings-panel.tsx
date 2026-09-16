"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@jayantgoyal/web-ui/button";
import { Label } from "@jayantgoyal/web-ui/label";

import { JobStatusList, type JobStatusRow } from "@/features/orbit/job-status-list";
import { createBoardFromTemplateAction } from "@/server/commands/feature-actions";
import {
  archiveWorkspaceAction,
  cancelWorkspaceDeletionAction,
  requestWorkspaceDeletionAction,
  downloadWorkspaceExportAction,
  requestWorkspaceExportAction,
  restoreWorkspaceAction,
  transferWorkspaceOwnershipAction,
} from "@/server/commands/lifecycle-actions";
import type { BoardTemplateSummary, MemberSummary, WorkspaceSummary } from "@/lib/orbit/types";

type WorkspaceSettingsPanelProps = {
  workspace: WorkspaceSummary;
  members: MemberSummary[];
  templates: BoardTemplateSummary[];
  currentUserId: string;
  exportJobs: JobStatusRow[];
};

export function WorkspaceSettingsPanel({
  workspace,
  members,
  templates,
  currentUserId,
  exportJobs,
}: WorkspaceSettingsPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [transferTargetId, setTransferTargetId] = useState("");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [boardName, setBoardName] = useState("");
  const [boardKey, setBoardKey] = useState("");

  const isOwner = workspace.ownerUserId === currentUserId;
  const eligibleTransferTargets = members.filter(
    (member) => member.userId !== currentUserId && member.status !== "removed",
  );

  function refresh() {
    router.refresh();
  }

  function run(action: () => Promise<{ ok: boolean; error?: string; id?: string; jobId?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.id) {
        toast.success("Board created");
        router.push(`/boards/${result.id}`);
        return;
      }
      toast.success("Workspace updated");
      refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <h2 className="font-semibold">Status</h2>
        <p className="mt-1 text-sm text-muted-foreground capitalize">
          Lifecycle: {workspace.lifecycle ?? "active"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={pending || workspace.lifecycle === "archived"}
            onClick={() => run(() => archiveWorkspaceAction(workspace.id))}
          >
            Archive workspace
          </Button>
          <Button
            variant="secondary"
            disabled={pending || workspace.lifecycle === "active"}
            onClick={() => run(() => restoreWorkspaceAction(workspace.id))}
          >
            Restore workspace
          </Button>
        </div>
      </div>

      {isOwner ? (
        <div className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Ownership</h2>
          <div className="space-y-2">
            <Label htmlFor="transfer-target">Transfer to member</Label>
            <select
              id="transfer-target"
              className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={transferTargetId}
              onChange={(event) => setTransferTargetId(event.target.value)}
            >
              <option value="">Select member</option>
              {eligibleTransferTargets.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.displayName} ({member.role})
                </option>
              ))}
            </select>
          </div>
          <Button
            disabled={pending || !transferTargetId}
            onClick={() =>
              run(() =>
                transferWorkspaceOwnershipAction({
                  workspaceId: workspace.id,
                  targetUserId: transferTargetId,
                }),
              )
            }
          >
            Transfer ownership
          </Button>
        </div>
      ) : null}

      {isOwner ? (
        <div className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Deletion</h2>
          <p className="text-sm text-muted-foreground">
            Request deletion to mark the workspace for removal. Cancel while pending.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              disabled={pending || workspace.lifecycle === "pending_deletion"}
              onClick={() => run(() => requestWorkspaceDeletionAction(workspace.id))}
            >
              Request deletion
            </Button>
            <Button
              variant="secondary"
              disabled={pending || workspace.lifecycle !== "pending_deletion"}
              onClick={() => run(() => cancelWorkspaceDeletionAction(workspace.id))}
            >
              Cancel deletion
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Export</h2>
        <p className="text-sm text-muted-foreground">
          Request a workspace export job. Processed by the Orbit export worker.
        </p>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => run(() => requestWorkspaceExportAction(workspace.id))}
        >
          Request export
        </Button>
        <JobStatusList
          jobs={exportJobs}
          emptyLabel="No export jobs yet."
          downloadPending={pending}
          onDownload={(jobId) =>
            startTransition(async () => {
              const result = await downloadWorkspaceExportAction(jobId);
              if (!result.ok) {
                toast.error("error" in result ? result.error : "Export unavailable");
                return;
              }
              if (!result.exportData) {
                toast.error("Export unavailable");
                return;
              }
              const blob = new Blob([JSON.stringify(result.exportData, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = `orbit-export-${jobId}.json`;
              anchor.click();
              URL.revokeObjectURL(url);
              toast.success("Export downloaded");
            })
          }
        />
      </div>

      {templates.length > 0 ? (
        <div className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Create board from template</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="flex h-10 rounded-md border bg-background px-3 text-sm"
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <input
              className="flex h-10 rounded-md border bg-background px-3 text-sm"
              value={boardName}
              onChange={(event) => setBoardName(event.target.value)}
              placeholder="Board name"
            />
            <input
              className="flex h-10 rounded-md border bg-background px-3 text-sm"
              value={boardKey}
              onChange={(event) => setBoardKey(event.target.value.toUpperCase())}
              placeholder="Key"
              maxLength={8}
            />
          </div>
          <Button
            disabled={
              pending || !templateId || boardName.trim().length < 2 || boardKey.trim().length < 2
            }
            onClick={() =>
              run(() =>
                createBoardFromTemplateAction({
                  workspaceId: workspace.id,
                  templateId,
                  name: boardName.trim(),
                  key: boardKey.trim(),
                }),
              )
            }
          >
            Create from template
          </Button>
        </div>
      ) : null}
    </div>
  );
}
