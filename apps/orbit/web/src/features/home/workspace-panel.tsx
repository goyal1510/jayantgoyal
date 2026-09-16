"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@jayantgoyal/web-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";
import { Input } from "@jayantgoyal/web-ui/input";
import { Label } from "@jayantgoyal/web-ui/label";

import {
  createBoardAction,
  createWorkspaceAction,
} from "@/server/commands/actions";
import type { BoardSummary, WorkspaceSummary } from "@/lib/orbit/types";

type WorkspacePanelProps = {
  workspaces: WorkspaceSummary[];
  boardsByWorkspace: Record<string, BoardSummary[]>;
};

export function WorkspacePanel({
  workspaces,
  boardsByWorkspace,
}: WorkspacePanelProps) {
  const [pending, startTransition] = useTransition();
  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
    workspaces[0]?.id ?? "",
  );
  const [boardName, setBoardName] = useState("");
  const [boardKey, setBoardKey] = useState("");

  function handleCreateWorkspace() {
    startTransition(async () => {
      const result = await createWorkspaceAction({ name: workspaceName });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Workspace created");
      setWorkspaceName("");
    });
  }

  function handleCreateBoard() {
    if (!selectedWorkspaceId) return;
    startTransition(async () => {
      const result = await createBoardAction({
        workspaceId: selectedWorkspaceId,
        name: boardName,
        key: boardKey,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Board created");
      setBoardName("");
      setBoardKey("");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {workspaces.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No workspaces yet</CardTitle>
              <CardDescription>
                Create your first workspace to start organizing boards and cards.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          workspaces.map((workspace) => (
            <Card key={workspace.id}>
              <CardHeader>
                <CardTitle>{workspace.name}</CardTitle>
                {workspace.description ? (
                  <CardDescription>{workspace.description}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-2">
                {(boardsByWorkspace[workspace.id] ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No boards yet in this workspace.
                  </p>
                ) : (
                  (boardsByWorkspace[workspace.id] ?? []).map((board) => (
                    <Link
                      key={board.id}
                      href={`/boards/${board.id}`}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
                    >
                      <span>{board.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {board.key}
                      </span>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Name</Label>
              <Input
                id="workspace-name"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                placeholder="Personal projects"
              />
            </div>
            <Button
              className="w-full"
              disabled={pending || workspaceName.trim().length < 2}
              onClick={handleCreateWorkspace}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create workspace
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">New board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="board-workspace">Workspace</Label>
              <select
                id="board-workspace"
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={selectedWorkspaceId}
                onChange={(event) => setSelectedWorkspaceId(event.target.value)}
              >
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-name">Board name</Label>
              <Input
                id="board-name"
                value={boardName}
                onChange={(event) => setBoardName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-key">Key</Label>
              <Input
                id="board-key"
                value={boardKey}
                onChange={(event) =>
                  setBoardKey(event.target.value.toUpperCase())
                }
                placeholder="OPS"
                maxLength={8}
              />
            </div>
            <Button
              className="w-full"
              disabled={
                pending ||
                !selectedWorkspaceId ||
                boardName.trim().length < 2 ||
                boardKey.trim().length < 2
              }
              onClick={handleCreateBoard}
            >
              Create board
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
