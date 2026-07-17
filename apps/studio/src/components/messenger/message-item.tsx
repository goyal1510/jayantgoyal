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
import type { Database } from "@/lib/messenger/database.types";
import { cn } from "@repo/ui/lib/utils";

type Message = Database["messenger"]["Tables"]["messages"]["Row"];

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
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
    const content = message.content || "";
    const firstLine = content.split("\n")[0] || "";
    return firstLine;
  };

  const preview = getPreview();

  const handleToggleRead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      await fetch(`/api/messenger/${message.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_read: !message.is_read,
        }),
      });
      // Realtime subscription will update the message in the list.
    } catch (error) {
      console.error("Failed to update is_read:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(message.content || "");
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
          message.is_read
            ? "bg-card text-foreground/70"
            : "border-[#cfc0e4] bg-[#e8dcf5]/45 dark:border-[#5c5068] dark:bg-[#2f2938]/70",
        )}
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            aria-label={
              message.is_read
                ? "Mark message as unread"
                : "Mark message as read"
            }
            className="mt-1 h-4 w-4 cursor-pointer accent-primary"
            checked={!!message.is_read}
            onChange={handleToggleRead}
            onClick={(e) => e.stopPropagation()}
            disabled={isUpdating}
          />

          <div className="flex-1 min-w-0">
            <CollapsibleTrigger asChild>
              <div className="-m-2 flex w-full cursor-pointer items-start justify-between gap-2 rounded-xl p-2 transition-colors hover:bg-background/45">
                <div className="flex-1 min-w-0">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(message.created_at)}</span>
                    {!message.is_read && (
                      <span className="font-medium text-foreground">
                        Unread
                      </span>
                    )}
                    {message.message_type === "code" && message.language && (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                        {message.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      {message.message_type === "code" ? (
                        <Code2 className="h-3 w-3" />
                      ) : (
                        <MessageSquare className="h-3 w-3" />
                      )}
                      {message.message_type === "code" ? "Code" : "Text"}
                    </span>
                  </div>
                  {!isOpen && (
                    <div className="text-sm">
                      {message.message_type === "code" ? (
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
                    aria-label="Copy message"
                    onClick={handleCopy}
                    className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-background/60"
                    title="Copy message"
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
                {message.message_type === "code" ? (
                  <div className="overflow-x-auto rounded-md">
                    <SyntaxHighlighter
                      language={message.language || "text"}
                      style={isDark ? vscDarkPlus : vs}
                      customStyle={{
                        margin: 0,
                        borderRadius: "0.375rem",
                        fontSize: "0.875rem",
                      }}
                      showLineNumbers
                    >
                      {message.content}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap break-words text-sm">
                    {message.content}
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
