"use client";

import * as React from "react";
import { Card } from "@repo/ui/card";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import {
  ChevronDown,
  ChevronUp,
  Code2,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/collapsible";
import type { Database } from "@/lib/scratchpad/database.types";
import { cn } from "@repo/ui/lib/utils";

type Entry = Database["scratchpad"]["Tables"]["entries"]["Row"];

interface EntryItemProps {
  entry: Entry;
}

export function EntryItem({ entry }: EntryItemProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
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

  const handleToggleRead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      await fetch(`/api/scratchpad/${entry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_read: !entry.is_read,
        }),
      });
      // Realtime subscription will update the entry in the list.
    } catch (error) {
      console.error("Failed to update is_read:", error);
    } finally {
      setIsUpdating(false);
    }
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
              entry.is_read
                ? "Mark entry as unread"
                : "Mark entry as read"
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
                    <SyntaxHighlighter
                      language={entry.language || "text"}
                      style={isDark ? vscDarkPlus : vs}
                      customStyle={{
                        margin: 0,
                        borderRadius: "0.375rem",
                        fontSize: "0.875rem",
                      }}
                      showLineNumbers
                    >
                      {entry.content}
                    </SyntaxHighlighter>
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
