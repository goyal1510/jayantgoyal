"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  HelpCircle,
  Plus,
  Loader2,
  Copy,
  Trash2,
  Clock,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Textarea } from "@repo/ui/textarea";
import { addQuestion, deleteQuestion } from "@/lib/jobs-api";
import type { JobApplicationQaItem, JobListing } from "@/lib/types";

const FIELD_GROUP_ORDER: Array<NonNullable<JobApplicationQaItem["field_group"]>> = [
  "main",
  "location",
  "compliance",
  "demographic",
  "other",
];

const GROUP_LABEL: Record<string, string> = {
  main: "Application form",
  location: "Location",
  compliance: "Compliance",
  demographic: "Voluntary self-ID",
  other: "Other",
  user_added: "Manually added",
};

export function QaPanel({
  listing,
  onChange,
}: {
  listing: JobListing;
  onChange: (qa: JobApplicationQaItem[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);

  const items = listing.ai_application_qa ?? [];
  const itemsWithIdx = items.map((q, originalIdx) => ({ q, originalIdx }));
  const pending = itemsWithIdx.filter(({ q }) => q.needs_answer);

  async function handleAdd() {
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    try {
      const r = await addQuestion(listing.id, text);
      onChange(r.data);
      setDraft("");
      setAdding(false);
      toast.success("Question saved — run /answer-questions in Claude Code");
    } catch {
      toast.error("Failed to save question");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(idx: number) {
    setBusyIndex(idx);
    try {
      const r = await deleteQuestion(listing.id, idx);
      onChange(r.data);
    } catch {
      toast.error("Delete failed");
    } finally {
      setBusyIndex(null);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  async function copyCommand() {
    await copyText(`/prepare-application ${listing.id}`);
  }

  async function handleCopyAll() {
    const text = items
      .filter((q) => q.answer != null && q.answer !== "")
      .map((q) => `${q.question}\n${q.answer}`)
      .join("\n\n---\n\n");
    await copyText(text);
  }

  // group items by field_group (preserving original index)
  const grouped = new Map<
    string,
    Array<{ q: JobApplicationQaItem; originalIdx: number }>
  >();
  for (const entry of itemsWithIdx) {
    const key = entry.q.field_group ?? entry.q.category ?? "other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(entry);
  }
  const orderedGroupKeys = [
    ...FIELD_GROUP_ORDER.filter((k) => grouped.has(k)),
    ...Array.from(grouped.keys()).filter(
      (k) => !FIELD_GROUP_ORDER.includes(k as never)
    ),
  ];

  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
          <HelpCircle className="h-3 w-3" /> Application Q&A
          <Badge variant="secondary" className="text-[10px]">
            {items.length - pending.length} answered
            {pending.length ? ` · ${pending.length} pending` : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAll}
              className="h-6 px-2"
            >
              <Copy className="mr-1 h-3 w-3" /> Copy all
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAdding((v) => !v)}
            className="h-6 px-2"
          >
            <Plus className="mr-1 h-3 w-3" /> {adding ? "Cancel" : "Add"}
          </Button>
        </div>
      </div>

      {items.length === 0 && (
        <div className="rounded border border-dashed p-3 text-xs">
          <p className="font-medium">Ready to apply to this one?</p>
          <p className="mt-1 text-muted-foreground">
            In Claude Code, run:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">
              /prepare-application {listing.id}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyCommand}
              className="ml-1 h-5 px-1.5"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </p>
          <p className="mt-1 text-muted-foreground">
            That fetches every field of the live application form and fills in
            answers — copy each one into the form.
          </p>
        </div>
      )}

      {adding && (
        <div className="mb-3 space-y-2">
          <Textarea
            placeholder="Paste a single question if /prepare-application missed it"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setDraft("");
              }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={busy || !draft.trim()}
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      )}

      {orderedGroupKeys.map((key) => {
        const entries = grouped.get(key) ?? [];
        if (entries.length === 0) return null;
        return (
          <div key={key} className="mb-3 last:mb-0">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {GROUP_LABEL[key] ?? key}
            </div>
            <div className="space-y-2">
              {entries.map(({ q, originalIdx }) => (
                <QaItemRow
                  key={originalIdx}
                  q={q}
                  busy={busyIndex === originalIdx}
                  onCopy={(t) => copyText(t)}
                  onDelete={() => handleDelete(originalIdx)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QaItemRow({
  q,
  busy,
  onCopy,
  onDelete,
}: {
  q: JobApplicationQaItem;
  busy: boolean;
  onCopy: (t: string) => void;
  onDelete: () => void;
}) {
  const isFile = q.field_type?.includes("file");
  const isSelect =
    q.field_type?.includes("select") || (q.values && q.values.length > 0);

  return (
    <div
      className={`rounded border p-2 text-sm ${q.needs_answer ? "border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {q.required && (
              <Badge
                variant="outline"
                className="border-rose-300 text-[10px] text-rose-600 dark:border-rose-700 dark:text-rose-400"
              >
                required
              </Badge>
            )}
            {q.field_type && (
              <Badge variant="secondary" className="text-[10px]">
                {q.field_type.replace(/_/g, " ")}
              </Badge>
            )}
            {q.needs_answer && (
              <Badge
                variant="outline"
                className="border-amber-400 text-[10px] text-amber-700 dark:text-amber-300"
              >
                <Clock className="mr-1 h-2.5 w-2.5" /> pending
              </Badge>
            )}
            <span className="font-medium">{q.question}</span>
          </div>
          {q.answer && (
            <div className="mt-1.5 whitespace-pre-wrap rounded bg-muted/50 p-2 text-sm leading-relaxed">
              {q.answer}
            </div>
          )}
          {isFile && q.answer && (
            <div className="mt-1 text-[10px] text-muted-foreground">
              ↑ file upload — open the path locally
            </div>
          )}
          {isSelect && q.values && q.values.length > 0 && (
            <details className="mt-1.5 text-[10px] text-muted-foreground">
              <summary className="cursor-pointer">
                {q.values.length} options available
              </summary>
              <ul className="mt-1 list-disc pl-4">
                {q.values.slice(0, 30).map((v, i) => (
                  <li key={i}>{v.label}</li>
                ))}
                {q.values.length > 30 && (
                  <li>…and {q.values.length - 30} more</li>
                )}
              </ul>
            </details>
          )}
          {q.note && (
            <div className="mt-1 text-xs italic text-amber-700 dark:text-amber-400">
              📝 {q.note}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {q.answer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(q.answer ?? "")}
              className="h-6 px-2"
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={busy}
            className="h-6 px-2 text-rose-500 hover:text-rose-600"
          >
            {busy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
