"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@jayantgoyal/web-ui/badge";
import { Button } from "@jayantgoyal/web-ui/button";
import { Input } from "@jayantgoyal/web-ui/input";
import { Label } from "@jayantgoyal/web-ui/label";

import {
  archiveCardAction,
  createLabelAction,
  setCardAssigneeAction,
  toggleCardLabelAction,
  trashCardAction,
  updateCardAction,
  uploadCardAttachmentAction,
} from "@/server/commands/actions";
import type {
  AttachmentSummary,
  CardSummary,
  LabelSummary,
  MemberSummary,
} from "@/lib/orbit/types";

type CardDetailPanelProps = {
  boardId: string;
  workspaceId: string;
  boardKey: string;
  card: CardSummary;
  labels: LabelSummary[];
  labelIds: string[];
  members: MemberSummary[];
  assigneeIds: string[];
  attachments: AttachmentSummary[];
  onClose: () => void;
};

export function CardDetailPanel({
  boardId,
  workspaceId,
  boardKey,
  card,
  labels,
  labelIds,
  members,
  assigneeIds,
  attachments,
  onClose,
}: CardDetailPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [priority, setPriority] = useState<
    "none" | "low" | "medium" | "high" | "urgent"
  >(card.priority as "none" | "low" | "medium" | "high" | "urgent");
  const [dueDate, setDueDate] = useState(
    card.dueDate ? card.dueDate.slice(0, 10) : "",
  );
  const [newLabelName, setNewLabelName] = useState("");

  function refresh() {
    router.refresh();
  }

  function saveDetails() {
    startTransition(async () => {
      const result = await updateCardAction({
        boardId,
        cardId: card.id,
        title,
        description,
        priority,
        dueDate: dueDate || null,
        expectedVersion: card.version,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Card updated");
      refresh();
    });
  }

  function handleArchive() {
    startTransition(async () => {
      const result = await archiveCardAction({
        boardId,
        cardId: card.id,
        expectedVersion: card.version,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Card archived");
      onClose();
      refresh();
    });
  }

  function handleTrash() {
    startTransition(async () => {
      const result = await trashCardAction({
        boardId,
        cardId: card.id,
        expectedVersion: card.version,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Card moved to trash");
      onClose();
      refresh();
    });
  }

  function handleToggleLabel(labelId: string, attached: boolean) {
    startTransition(async () => {
      const result = await toggleCardLabelAction({
        boardId,
        cardId: card.id,
        labelId,
        attach: !attached,
      });
      if (!result.ok) toast.error(result.error);
      else refresh();
    });
  }

  function handleToggleAssignee(userId: string, attached: boolean) {
    startTransition(async () => {
      const result = await setCardAssigneeAction({
        boardId,
        cardId: card.id,
        userId,
        attach: !attached,
      });
      if (!result.ok) toast.error(result.error);
      else refresh();
    });
  }

  function handleCreateLabel() {
    if (!newLabelName.trim()) return;
    startTransition(async () => {
      const result = await createLabelAction({
        workspaceId,
        boardId,
        name: newLabelName.trim(),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setNewLabelName("");
      toast.success("Label created");
      refresh();
    });
  }

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  }

  function handleUpload(file: File | null) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Files must be 10 MB or smaller.");
      return;
    }

    startTransition(async () => {
      const base64 = arrayBufferToBase64(await file.arrayBuffer());
      const result = await uploadCardAttachmentAction({
        boardId,
        cardId: card.id,
        fileName: file.name,
        mime: file.type || "application/octet-stream",
        bytes: file.size,
        fileBase64: base64,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Attachment uploaded");
      refresh();
    });
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-muted-foreground">
            {boardKey}-{card.number}
          </p>
          <h2 className="text-lg font-semibold">Card details</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="card-title">Title</Label>
            <Input
              id="card-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="card-description">Description</Label>
            <textarea
              id="card-description"
              className="min-h-[96px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="card-priority">Priority</Label>
              <select
                id="card-priority"
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value as
                      | "none"
                      | "low"
                      | "medium"
                      | "high"
                      | "urgent",
                  )
                }
              >
                {["none", "low", "medium", "high", "urgent"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-due">Due date</Label>
              <Input
                id="card-due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
          </div>
          <Button disabled={pending} onClick={saveDetails}>
            Save changes
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Labels</p>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => {
                const attached = labelIds.includes(label.id);
                return (
                  <button
                    key={label.id}
                    type="button"
                    disabled={pending}
                    onClick={() => handleToggleLabel(label.id, attached)}
                  >
                    <Badge variant={attached ? "default" : "outline"}>
                      {label.name}
                    </Badge>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={newLabelName}
                onChange={(event) => setNewLabelName(event.target.value)}
                placeholder="New label"
              />
              <Button
                variant="secondary"
                disabled={pending || !newLabelName.trim()}
                onClick={handleCreateLabel}
              >
                Add
              </Button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Assignees</p>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const attached = assigneeIds.includes(member.userId);
                return (
                  <button
                    key={member.userId}
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      handleToggleAssignee(member.userId, attached)
                    }
                  >
                    <Badge variant={attached ? "default" : "outline"}>
                      {member.displayName}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Attachments</p>
            <Input
              type="file"
              disabled={pending}
              onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
            />
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {attachments.map((attachment) => (
                <li key={attachment.id}>
                  {attachment.originalName} ({Math.round(attachment.bytes / 1024)} KB)
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" disabled={pending} onClick={handleArchive}>
              Archive
            </Button>
            <Button variant="destructive" disabled={pending} onClick={handleTrash}>
              Trash
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
