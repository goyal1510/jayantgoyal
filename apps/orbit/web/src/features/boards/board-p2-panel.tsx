"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@jayantgoyal/web-ui/button";
import { Input } from "@jayantgoyal/web-ui/input";
import { Label } from "@jayantgoyal/web-ui/label";

import { BoardReportsPanel } from "@/features/boards/board-reports-panel";
import { JobStatusList, type JobStatusRow } from "@/features/orbit/job-status-list";
import {
  createAutomationRuleAction,
  deleteAutomationRuleAction,
  publishBoardAction,
  requestBoardImportAction,
  revokePublishedBoardAction,
} from "@/server/commands/p2-actions";
import type {
  AutomationRuleSummary,
  ColumnSummary,
  LabelSummary,
  PublishedBoardSummary,
} from "@/lib/orbit/types";

type BoardP2PanelProps = {
  boardId: string;
  boardKey: string;
  columns: ColumnSummary[];
  labels: LabelSummary[];
  automationRules: AutomationRuleSummary[];
  publishedBoard: PublishedBoardSummary | null;
  reports: {
    completion: Record<string, unknown>;
    backlog: Record<string, unknown>;
    staleCards: Array<Record<string, unknown>>;
  };
  importJobs?: JobStatusRow[];
  mode?: "all" | "automation" | "reports" | "publish";
};

export function BoardP2Panel({
  boardId,
  boardKey,
  columns,
  labels,
  automationRules,
  publishedBoard,
  reports,
  importJobs = [],
  mode = "all",
}: BoardP2PanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [ruleName, setRuleName] = useState("");
  const [columnId, setColumnId] = useState(columns[0]?.id ?? "");
  const [labelId, setLabelId] = useState(labels[0]?.id ?? "");
  const [slug, setSlug] = useState(publishedBoard?.slug ?? "");
  const [importJson, setImportJson] = useState('{"cards":[{"title":"Imported card"}]}');

  function refresh() {
    router.refresh();
  }

  const showAutomation = mode === "all" || mode === "automation";
  const showReports = mode === "all" || mode === "reports";
  const showPublish = mode === "all" || mode === "publish";

  return (
    <div className="space-y-6">
      {showAutomation ? (
        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="font-semibold">Automation</h2>
          <p className="text-sm text-muted-foreground">
            When a card moves to a column, apply a label automatically.
          </p>
          {automationRules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span>{rule.name}</span>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await deleteAutomationRuleAction({
                      boardId,
                      ruleId: rule.id,
                    });
                    if (!result.ok) toast.error(result.error);
                    else refresh();
                  })
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="Rule name"
            />
            <select
              className="h-10 rounded-md border bg-background px-2 text-sm"
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
            >
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border bg-background px-2 text-sm"
              value={labelId}
              onChange={(e) => setLabelId(e.target.value)}
            >
              {labels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            disabled={pending || !ruleName.trim() || !columnId || !labelId}
            onClick={() =>
              startTransition(async () => {
                const result = await createAutomationRuleAction({
                  boardId,
                  name: ruleName.trim(),
                  columnId,
                  labelId,
                });
                if (!result.ok) toast.error(result.error);
                else {
                  setRuleName("");
                  toast.success("Automation rule created");
                  refresh();
                }
              })
            }
          >
            Add rule
          </Button>
        </section>
      ) : null}

      {showReports ? (
        <BoardReportsPanel boardId={boardId} boardKey={boardKey} reports={reports} compact />
      ) : null}

      {showPublish ? (
        <>
          <section className="space-y-3 rounded-lg border p-4">
            <h2 className="font-semibold">Public read-only board</h2>
            {publishedBoard ? (
              <p className="text-sm">
                Published at{" "}
                <Link
                  href={`/public/boards/${publishedBoard.slug}`}
                  className="text-primary underline"
                  target="_blank"
                >
                  /public/boards/{publishedBoard.slug}
                </Link>
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="public-slug"
                className="max-w-xs"
              />
              <Button
                disabled={pending || slug.trim().length < 3}
                onClick={() =>
                  startTransition(async () => {
                    const result = await publishBoardAction({
                      boardId,
                      slug: slug.trim(),
                    });
                    if (!result.ok) toast.error(result.error);
                    else {
                      toast.success("Board published");
                      refresh();
                    }
                  })
                }
              >
                Publish
              </Button>
              {publishedBoard ? (
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await revokePublishedBoardAction(boardId);
                      if (!result.ok) toast.error(result.error);
                      else refresh();
                    })
                  }
                >
                  Revoke
                </Button>
              ) : null}
            </div>
          </section>

          <section className="space-y-3 rounded-lg border p-4">
            <h2 className="font-semibold">Import (Orbit JSON)</h2>
            <Label htmlFor="import-json">Payload</Label>
            <textarea
              id="import-json"
              className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
            />
            <Input
              type="file"
              accept="application/json,.json"
              disabled={pending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                void file.text().then((text) => {
                  setImportJson(text);
                  toast.success("Import file loaded");
                });
              }}
            />
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    const payload = JSON.parse(importJson) as Record<string, unknown>;
                    const result = await requestBoardImportAction({ boardId, payload });
                    if (!result.ok) toast.error(result.error);
                    else {
                      toast.success("Import job queued");
                      refresh();
                    }
                  } catch {
                    toast.error("Invalid JSON payload");
                  }
                })
              }
            >
              Queue import
            </Button>
            <JobStatusList jobs={importJobs} emptyLabel="No import jobs yet." />
          </section>
        </>
      ) : null}
    </div>
  );
}
