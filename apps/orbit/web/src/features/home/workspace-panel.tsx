"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, Plus, Settings, Star, Users } from "lucide-react";
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
import { toggleBoardFavoriteAction } from "@/server/commands/lifecycle-actions";
import { createBoardFromTemplateAction } from "@/server/commands/feature-actions";
import type {
  BoardSummary,
  BoardTemplateSummary,
  WorkspaceSummary,
} from "@/lib/orbit/types";

type WorkspacePanelProps = {
  workspaces: WorkspaceSummary[];
  boardsByWorkspace: Record<string, BoardSummary[]>;
  favoriteBoardIdsByWorkspace: Record<string, string[]>;
  templatesByWorkspace: Record<string, BoardTemplateSummary[]>;
};

export function WorkspacePanel({
  workspaces,
  boardsByWorkspace,
  favoriteBoardIdsByWorkspace,
  templatesByWorkspace,
}: WorkspacePanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
    workspaces[0]?.id ?? "",
  );
  const [boardName, setBoardName] = useState("");
  const [boardKey, setBoardKey] = useState("");
  const [templateBoardName, setTemplateBoardName] = useState("");
  const [templateBoardKey, setTemplateBoardKey] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const workspaceTemplates = templatesByWorkspace[selectedWorkspaceId] ?? [];

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

  function handleCreateFromTemplate() {
    if (!selectedWorkspaceId || !selectedTemplateId) return;
    startTransition(async () => {
      const result = await createBoardFromTemplateAction({
        workspaceId: selectedWorkspaceId,
        templateId: selectedTemplateId,
        name: templateBoardName.trim(),
        key: templateBoardKey.trim(),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Board created from template");
      setTemplateBoardName("");
      setTemplateBoardKey("");
      if (result.id) router.push(`/boards/${result.id}`);
      else router.refresh();
    });
  }

  function handleToggleFavorite(boardId: string, favorite: boolean) {
    startTransition(async () => {
      const result = await toggleBoardFavoriteAction({ boardId, favorite });
      if (!result.ok) toast.error(result.error);
      else router.refresh();
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
            const favorites = new Set(favoriteBoardIdsByWorkspace[workspace.id] ?? []);
            const sortedBoards = [...boards].sort((left, right) => {
              const leftFav = favorites.has(left.id) ? 0 : 1;
              const rightFav = favorites.has(right.id) ? 0 : 1;
              return leftFav - rightFav || left.name.localeCompare(right.name);
            });
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
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/workspaces/${workspace.id}/settings`}>
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/workspaces/${workspace.id}/members`}>
                          <Users className="mr-2 h-4 w-4" />
                          Members
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {boards.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No boards yet in this workspace.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {sortedBoards.map((board) => {
                        const isFavorite = favorites.has(board.id);
                        return (
                          <div
                            key={board.id}
                            className="group flex items-center justify-between rounded-lg border bg-background px-4 py-3 transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
                          >
                            <Link href={`/boards/${board.id}`} className="min-w-0 flex-1">
                              <p className="truncate font-medium group-hover:text-primary">
                                {board.name}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {board.visibility}
                              </p>
                            </Link>
                            <div className="ml-3 flex shrink-0 items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={pending}
                                aria-label={isFavorite ? "Unfavorite board" : "Favorite board"}
                                onClick={() => handleToggleFavorite(board.id, !isFavorite)}
                              >
                                <Star
                                  className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`}
                                />
                              </Button>
                              <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                                {board.key}
                              </span>
                            </div>
                          </div>
                        );
                      })}
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

        {workspaceTemplates.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">From template</CardTitle>
              <CardDescription>
                Create a board using a saved workspace template.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={selectedTemplateId || workspaceTemplates[0]?.id}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
              >
                {workspaceTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <Input
                value={templateBoardName}
                onChange={(event) => setTemplateBoardName(event.target.value)}
                placeholder="Board name"
              />
              <Input
                value={templateBoardKey}
                onChange={(event) =>
                  setTemplateBoardKey(event.target.value.toUpperCase())
                }
                placeholder="Key"
                maxLength={8}
              />
              <Button
                className="w-full"
                variant="secondary"
                disabled={
                  pending ||
                  templateBoardName.trim().length < 2 ||
                  templateBoardKey.trim().length < 2
                }
                onClick={handleCreateFromTemplate}
              >
                Create from template
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
