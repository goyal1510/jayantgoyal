"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@jayantgoyal/web-ui/button";
import { Input } from "@jayantgoyal/web-ui/input";

import {
  addCardDependencyAction,
  addChecklistItemAction,
  createChecklistAction,
  getAttachmentDownloadUrlAction,
  setCardRecurrenceAction,
  snoozeCardAction,
  toggleCardWatchAction,
  toggleChecklistItemAction,
} from "@/server/commands/feature-actions";
import type {
  AttachmentSummary,
  ChecklistSummary,
  DependencySummary,
} from "@/lib/orbit/types";

type CardDetailExtrasProps = {
  boardId: string;
  cardId: string;
  checklists: ChecklistSummary[];
  dependencies: DependencySummary[];
  attachments: AttachmentSummary[];
  watched: boolean;
  allCards: Array<{ id: string; number: number; title: string }>;
};

export function CardDetailExtras({
  boardId,
  cardId,
  checklists,
  dependencies,
  attachments,
  watched,
  allCards,
}: CardDetailExtrasProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [checklistTitle, setChecklistTitle] = useState("");
  const [itemDrafts, setItemDrafts] = useState<Record<string, string>>({});
  const [dependsOnId, setDependsOnId] = useState("");

  function refresh() {
    router.refresh();
  }

  function addChecklist() {
    if (!checklistTitle.trim()) return;
    startTransition(async () => {
      const result = await createChecklistAction({
        boardId,
        cardId,
        title: checklistTitle.trim(),
      });
      if (!result.ok) toast.error(result.error);
      else {
        setChecklistTitle("");
        refresh();
      }
    });
  }

  function addItem(checklistId: string) {
    const body = itemDrafts[checklistId]?.trim();
    if (!body) return;
    startTransition(async () => {
      const result = await addChecklistItemAction({ boardId, checklistId, body });
      if (!result.ok) toast.error(result.error);
      else {
        setItemDrafts((current) => ({ ...current, [checklistId]: "" }));
        refresh();
      }
    });
  }

  function toggleItem(itemId: string, completed: boolean) {
    startTransition(async () => {
      const result = await toggleChecklistItemAction({
        boardId,
        itemId,
        completed: !completed,
      });
      if (!result.ok) toast.error(result.error);
      else refresh();
    });
  }

  function toggleWatch() {
    startTransition(async () => {
      const result = await toggleCardWatchAction({
        boardId,
        cardId,
        watch: !watched,
      });
      if (!result.ok) toast.error(result.error);
      else refresh();
    });
  }

  function snooze(days: number) {
    const until = new Date(Date.now() + days * 86400000).toISOString();
    startTransition(async () => {
      const result = await snoozeCardAction({ boardId, cardId, snoozeUntil: until });
      if (!result.ok) toast.error(result.error);
      else toast.success(`Snoozed for ${days} day(s)`);
    });
  }

  function addDependency() {
    if (!dependsOnId) return;
    startTransition(async () => {
      const result = await addCardDependencyAction({
        boardId,
        cardId,
        dependsOnCardId: dependsOnId,
      });
      if (!result.ok) toast.error(result.error);
      else {
        setDependsOnId("");
        refresh();
      }
    });
  }

  function setRecurrence(cadence: "daily" | "weekly" | "monthly") {
    startTransition(async () => {
      const result = await setCardRecurrenceAction({ boardId, cardId, cadence });
      if (!result.ok) toast.error(result.error);
      else toast.success(`Recurrence set to ${cadence}`);
    });
  }

  function downloadAttachment(attachmentId: string) {
    startTransition(async () => {
      const result = await getAttachmentDownloadUrlAction(attachmentId);
      if (!result.ok || !result.url) {
        toast.error(result.ok ? "Download unavailable" : result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={watched ? "default" : "outline"} disabled={pending} onClick={toggleWatch}>
          {watched ? "Watching" : "Watch"}
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => snooze(1)}>
          Snooze 1d
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setRecurrence("weekly")}>
          Repeat weekly
        </Button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Checklists</p>
        {checklists.map((checklist) => (
          <div key={checklist.id} className="mb-3 rounded-md border p-2">
            <p className="text-sm font-medium">{checklist.title}</p>
            <ul className="mt-1 space-y-1">
              {checklist.items.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    disabled={pending}
                    onChange={() => toggleItem(item.id, item.completed)}
                  />
                  <span className={item.completed ? "line-through opacity-60" : ""}>
                    {item.body}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <Input
                value={itemDrafts[checklist.id] ?? ""}
                onChange={(e) =>
                  setItemDrafts((c) => ({ ...c, [checklist.id]: e.target.value }))
                }
                placeholder="Add item"
              />
              <Button size="sm" disabled={pending} onClick={() => addItem(checklist.id)}>
                Add
              </Button>
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            value={checklistTitle}
            onChange={(e) => setChecklistTitle(e.target.value)}
            placeholder="New checklist"
          />
          <Button size="sm" variant="secondary" disabled={pending} onClick={addChecklist}>
            Add checklist
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Dependencies</p>
        <ul className="mb-2 space-y-1 text-sm text-muted-foreground">
          {dependencies.map((dep) => (
            <li key={dep.id}>
              Blocks #{dep.dependsOnNumber} — {dep.dependsOnTitle}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <select
            className="h-10 flex-1 rounded-md border bg-background px-2 text-sm"
            value={dependsOnId}
            onChange={(e) => setDependsOnId(e.target.value)}
          >
            <option value="">Select card</option>
            {allCards
              .filter((entry) => entry.id !== cardId)
              .map((entry) => (
                <option key={entry.id} value={entry.id}>
                  #{entry.number} {entry.title}
                </option>
              ))}
          </select>
          <Button size="sm" disabled={pending || !dependsOnId} onClick={addDependency}>
            Add
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Attachment downloads</p>
        <ul className="space-y-1 text-sm">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              <button
                type="button"
                className="text-primary underline"
                disabled={pending}
                onClick={() => downloadAttachment(attachment.id)}
              >
                {attachment.originalName}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
