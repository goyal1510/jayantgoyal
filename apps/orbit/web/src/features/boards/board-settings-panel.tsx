"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@jayantgoyal/web-ui/button";
import { Input } from "@jayantgoyal/web-ui/input";
import { Label } from "@jayantgoyal/web-ui/label";

import {
  archiveBoardAction,
  createColumnAction,
  deleteColumnAction,
  restoreBoardAction,
  trashBoardAction,
  updateBoardAction,
  updateColumnAction,
} from "@/server/commands/lifecycle-actions";
import { saveBoardTemplateAction } from "@/server/commands/feature-actions";
import type { BoardSummary, ColumnSummary } from "@/lib/orbit/types";

type BoardSettingsPanelProps = {
  board: BoardSummary;
  columns: ColumnSummary[];
};

export function BoardSettingsPanel({ board, columns }: BoardSettingsPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState(board.visibility);
  const [newColumnName, setNewColumnName] = useState("");
  const [templateName, setTemplateName] = useState("");

  function refresh() {
    router.refresh();
  }

  function saveBoard() {
    startTransition(async () => {
      const result = await updateBoardAction({
        boardId: board.id,
        name,
        description,
        visibility,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Board updated");
      refresh();
    });
  }

  function addColumn() {
    if (!newColumnName.trim()) return;
    startTransition(async () => {
      const result = await createColumnAction({
        boardId: board.id,
        name: newColumnName.trim(),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setNewColumnName("");
      toast.success("Column added");
      refresh();
    });
  }

  function renameColumn(columnId: string, columnName: string) {
    startTransition(async () => {
      const result = await updateColumnAction({
        boardId: board.id,
        columnId,
        name: columnName,
      });
      if (!result.ok) toast.error(result.error);
      else refresh();
    });
  }

  function removeColumn(columnId: string) {
    const destination = columns.find((column) => column.id !== columnId)?.id;
    if (!destination) {
      toast.error("Add another column before deleting this one.");
      return;
    }
    startTransition(async () => {
      const result = await deleteColumnAction({
        boardId: board.id,
        columnId,
        destinationColumnId: destination,
      });
      if (!result.ok) toast.error(result.error);
      else {
        toast.success("Column removed");
        refresh();
      }
    });
  }

  function saveTemplate() {
    if (!templateName.trim()) return;
    startTransition(async () => {
      const result = await saveBoardTemplateAction({
        boardId: board.id,
        name: templateName.trim(),
      });
      if (!result.ok) toast.error(result.error);
      else toast.success("Template saved");
    });
  }

  function lifecycleAction(action: "archive" | "trash" | "restore") {
    startTransition(async () => {
      const result =
        action === "archive"
          ? await archiveBoardAction(board.id)
          : action === "trash"
            ? await trashBoardAction(board.id)
            : await restoreBoardAction(board.id);
      if (!result.ok) toast.error(result.error);
      else {
        toast.success(`Board ${action}d`);
        router.push("/home");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Board details</h2>
        <div className="space-y-2">
          <Label htmlFor="board-name">Name</Label>
          <Input id="board-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="board-description">Description</Label>
          <textarea
            id="board-description"
            className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="board-visibility">Visibility</Label>
          <select
            id="board-visibility"
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as BoardSummary["visibility"])
            }
          >
            <option value="workspace">Workspace</option>
            <option value="private">Private</option>
          </select>
        </div>
        <Button disabled={pending} onClick={saveBoard}>
          Save board
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Columns</h2>
        {columns.map((column) => (
          <div key={column.id} className="flex gap-2">
            <Input
              defaultValue={column.name}
              onBlur={(event) => {
                if (event.target.value !== column.name) {
                  renameColumn(column.id, event.target.value);
                }
              }}
            />
            <Button
              variant="outline"
              disabled={pending || columns.length <= 1}
              onClick={() => removeColumn(column.id)}
            >
              Delete
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            placeholder="New column"
          />
          <Button disabled={pending} variant="secondary" onClick={addColumn}>
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Template</h2>
        <div className="flex gap-2">
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template name"
          />
          <Button disabled={pending} variant="secondary" onClick={saveTemplate}>
            Save template
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={pending} onClick={() => lifecycleAction("archive")}>
          Archive board
        </Button>
        <Button variant="destructive" disabled={pending} onClick={() => lifecycleAction("trash")}>
          Trash board
        </Button>
        <Button variant="secondary" disabled={pending} onClick={() => lifecycleAction("restore")}>
          Restore board
        </Button>
      </div>
    </div>
  );
}
