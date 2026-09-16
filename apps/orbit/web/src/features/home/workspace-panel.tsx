"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, Plus, Users } from "lucide-react";
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
  const router = useRouter();
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
      router.refresh();
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
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        {workspaces.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>No workspaces yet</CardTitle>
              <CardDescription>
                Create your first workspace to start organizing boards and cards.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          workspaces.map((workspace) => {
            const boards = boardsByWorkspace[workspace.id] ?? [];
            return (
              <Card key={workspace.id} className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>{workspace.name}</CardTitle>
                      {workspace.description ? (
                        <CardDescription className="mt-1">
                          {workspace.description}
                        </CardDescription>
                      ) : null}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/workspaces/${workspace.id}/members`}>
                        <Users className="mr-2 h-4 w-4" />
                        Members
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {boards.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No boards yet in this workspace.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {boards.map((board) => (
                        <Link
                          key={board.id}
                          href={`/boards/${board.id}`}
                          className="group flex items-center justify-between rounded-lg border bg-background px-4 py-3 transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium group-hover:text-primary">
                              {board.name}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {board.visibility}
                            </p>
                          </div>
                          <span className="ml-3 shrink-0 rounded-md bg-muted px-2 py-1 font-mono text-xs">
                            {board.key}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4" />
              New workspace
            </CardTitle>
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
              Create workspace
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutGrid className="h-4 w-4" />
              New board
            </CardTitle>
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
