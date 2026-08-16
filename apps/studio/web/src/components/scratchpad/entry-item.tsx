"use client";

import * as React from "react";
import { Card } from "@jayant/web-ui/card";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import {
  ChevronDown,
  ChevronUp,
  Code2,
  MessageSquare,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@jayant/web-ui/collapsible";
import type { Database } from "@/lib/scratchpad/database.types";
import { cn } from "@jayant/web-ui/lib/utils";

type Entry = Database["scratchpad"]["Tables"]["entries"]["Row"];

interface EntryItemProps {
  entry: Entry;
  isUpdating: boolean;
  onToggleRead: (entryId: string, nextIsRead: boolean) => void;
  onDelete: (entryId: string) => void;
}

const CodeEntryContent = dynamic(
  () =>
    import("./code-entry-content").then((module) => module.CodeEntryContent),
  {
    ssr: false,
    loading: () => (
      <pre className="m-0 overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm">
        Loading syntax highlighting…
      </pre>
    ),
  },
);

export function EntryItem({
  entry,
  isUpdating,
  onToggleRead,
  onDelete,
}: EntryItemProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Preview: first line only
  const getPreview = () => {
    const content = entry.content || "";
    const firstLine = content.split("\n")[0] || "";
    return firstLine;
  };

  const preview = getPreview();

  const handleToggleRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (isUpdating) return;
    onToggleRead(entry.id, !entry.is_read);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(entry.content || "");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        className={cn(
          "rounded-2xl border-border/80 p-3 shadow-none transition-colors sm:p-4",
          entry.is_read
            ? "bg-card text-foreground/70"
            : "border-[#cfc0e4] bg-[#e8dcf5]/45 dark:border-[#5c5068] dark:bg-[#2f2938]/70",
        )}
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            aria-label={
              entry.is_read ? "Mark entry as unread" : "Mark entry as read"
            }
            className="mt-1 h-4 w-4 cursor-pointer accent-primary"
            checked={!!entry.is_read}
            onChange={handleToggleRead}
            onClick={(e) => e.stopPropagation()}
            disabled={isUpdating}
          />

          <div className="flex-1 min-w-0">
            <CollapsibleTrigger asChild>
              <div className="-m-2 flex w-full cursor-pointer items-start justify-between gap-2 rounded-xl p-2 transition-colors hover:bg-background/45">
                <div className="flex-1 min-w-0">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(entry.created_at)}</span>
                    {!entry.is_read && (
                      <span className="font-medium text-foreground">
                        Unread
                      </span>
                    )}
                    {entry.entry_type === "code" && entry.language && (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                        {entry.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      {entry.entry_type === "code" ? (
                        <Code2 className="h-3 w-3" />
                      ) : (
                        <MessageSquare className="h-3 w-3" />
                      )}
                      {entry.entry_type === "code" ? "Code" : "Text"}
                    </span>
                  </div>
                  {!isOpen && (
                    <div className="text-sm">
                      {entry.entry_type === "code" ? (
                        <pre className="whitespace-pre-wrap break-words text-muted-foreground line-clamp-1">
                          {preview}
                        </pre>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-muted-foreground line-clamp-1">
                          {preview}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    aria-label="Copy entry"
                    onClick={handleCopy}
                    className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-background/60"
                    title="Copy entry"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Delete entry"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(entry.id);
                    }}
                    disabled={isUpdating}
                    className="cursor-pointer rounded-lg p-1.5 text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Delete entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-3 border-t border-border/70 pt-3">
                {entry.entry_type === "code" ? (
                  <div className="overflow-x-auto rounded-md">
                    <CodeEntryContent
                      content={entry.content}
                      language={entry.language || "text"}
                      isDark={isDark}
                    />
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap break-words text-sm">
                    {entry.content}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </div>
      </Card>
    </Collapsible>
  );
}
