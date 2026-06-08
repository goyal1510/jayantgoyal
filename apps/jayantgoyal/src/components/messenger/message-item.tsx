"use client";

import * as React from "react";
import { Button } from "@repo/ui/button";
import { Textarea } from "@repo/ui/textarea";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import { Check, Copy, FileIcon, Pencil, SmilePlus, Trash2, X } from "lucide-react";
import type { Database } from "@/lib/messenger/database.types";
import type { MessengerParticipant } from "@/lib/messenger/server";
import { cn } from "@repo/ui/lib/utils";
import { formatFileSize } from "@/lib/file-manager/format-utils";

type Message = Database["messenger"]["Tables"]["messages"]["Row"];

type MessengerAttachment = {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
};

interface MessageItemProps {
  message: Message;
  currentUserId: string;
  participant?: MessengerParticipant;
  onEditMessage: (messageId: string, content: string) => Promise<boolean>;
  onDeleteMessage: (messageId: string) => Promise<boolean>;
  onReactToMessage: (messageId: string, reaction: string) => Promise<boolean>;
}

const REACTION_OPTIONS = [
  { value: "thumbs_up", icon: "\u{1F44D}" },
  { value: "heart", icon: "\u{2764}\u{FE0F}" },
  { value: "laugh", icon: "\u{1F602}" },
  { value: "celebrate", icon: "\u{1F389}" },
  { value: "eyes", icon: "\u{1F440}" },
];

function getReactions(message: Message) {
  const metadata = message.metadata;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  const reactions = metadata.reactions;

  if (!reactions || typeof reactions !== "object" || Array.isArray(reactions)) {
    return {};
  }

  return reactions as Record<string, string[]>;
}

function getAttachments(message: Message): MessengerAttachment[] {
  const metadata = message.metadata;

  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return [];
  }

  const attachments = metadata.attachments;

  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments.filter((attachment): attachment is MessengerAttachment => {
    if (!attachment || typeof attachment !== "object" || Array.isArray(attachment)) {
      return false;
    }

    return (
      typeof attachment.id === "string" &&
      typeof attachment.name === "string" &&
      typeof attachment.mime_type === "string" &&
      typeof attachment.size_bytes === "number"
    );
  });
}

export function MessageItem({
  message,
  currentUserId,
  participant,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
}: MessageItemProps) {
  const { theme } = useTheme();
  const [isCopied, setIsCopied] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(message.content);
  const [isSaving, setIsSaving] = React.useState(false);
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

  const handleSave = async () => {
    if (!draft.trim() || isSaving) return;

    setIsSaving(true);
    const success = await onEditMessage(message.id, draft.trim());
    setIsSaving(false);

    if (success) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (isSaving) return;
    setIsSaving(true);
    await onDeleteMessage(message.id);
    setIsSaving(false);
  };

  const isOwn = (message.sender_id ?? message.user_id) === currentUserId;
  const author = isOwn ? "You" : participant?.display_label ?? "User";
  const isDeleted = Boolean(message.deleted_at);
  const reactions = getReactions(message);
  const attachments = getAttachments(message);

  return (
    <div className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "group max-w-[min(680px,88%)]",
          isOwn ? "items-end" : "items-start",
          "flex flex-col gap-1"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 px-1 text-xs text-muted-foreground",
            isOwn && "flex-row-reverse"
          )}
        >
          <span className="font-medium text-foreground/80">{author}</span>
          <span>{formatDate(message.created_at)}</span>
          {message.edited_at && <span>edited</span>}
          {message.message_type === "code" && message.language && (
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
              {message.language}
            </span>
          )}
        </div>

        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm shadow-sm",
            isOwn
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md border bg-background"
          )}
        >
          {isDeleted ? (
            <span className="italic opacity-70">Message deleted</span>
          ) : isEditing ? (
            <div className="flex min-w-64 flex-col gap-2">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="min-h-24 bg-background text-foreground"
                disabled={isSaving}
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setDraft(message.content);
                    setIsEditing(false);
                  }}
                  disabled={isSaving}
                  title="Cancel edit"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={handleSave}
                  disabled={!draft.trim() || isSaving}
                  title="Save edit"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {message.content && message.message_type === "code" ? (
                <div className="max-w-full overflow-x-auto rounded-md">
                  <SyntaxHighlighter
                    language={message.language || "text"}
                    style={isDark ? vscDarkPlus : vs}
                    customStyle={{
                      margin: 0,
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      background: isOwn ? "rgba(0,0,0,0.18)" : undefined,
                    }}
                    showLineNumbers
                  >
                    {message.content}
                  </SyntaxHighlighter>
                </div>
              ) : message.content ? (
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              ) : null}

              {attachments.length > 0 && (
                <div className="flex flex-col gap-2">
                  {attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={`/api/messenger/${message.id}/attachments/${attachment.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors",
                        isOwn
                          ? "border-primary-foreground/20 bg-primary-foreground/10 hover:bg-primary-foreground/20"
                          : "bg-muted/40 hover:bg-muted"
                      )}
                    >
                      <FileIcon className="h-4 w-4 flex-none" />
                      <span className="min-w-0 flex-1 truncate">
                        {attachment.name}
                      </span>
                      <span className="flex-none opacity-80">
                        {formatFileSize(attachment.size_bytes)}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {!isDeleted && !isEditing && (
          <div
            className={cn(
              "flex flex-wrap gap-1 px-1 opacity-0 transition-opacity group-hover:opacity-100",
              isOwn && "flex-row-reverse"
            )}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleCopy}
              title="Copy message"
            >
              {isCopied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            {isOwn && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setIsEditing(true)}
                  title="Edit message"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={isSaving}
                  title="Delete message"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <div className="flex items-center gap-0.5 rounded-md border bg-background p-0.5 shadow-sm">
              <SmilePlus className="mx-1 h-3.5 w-3.5 text-muted-foreground" />
              {REACTION_OPTIONS.map((reaction) => (
                <Button
                  key={reaction.value}
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-sm"
                  onClick={() => onReactToMessage(message.id, reaction.value)}
                  title="React"
                >
                  {reaction.icon}
                </Button>
              ))}
            </div>
          </div>
        )}

        {!isDeleted && Object.keys(reactions).length > 0 && (
          <div className={cn("flex flex-wrap gap-1 px-1", isOwn && "justify-end")}>
            {REACTION_OPTIONS.map((reaction) => {
              const users = reactions[reaction.value] ?? [];
              if (users.length === 0) return null;

              const reactedByCurrentUser = users.includes(currentUserId);

              return (
                <button
                  key={reaction.value}
                  type="button"
                  onClick={() => onReactToMessage(message.id, reaction.value)}
                  className={cn(
                    "rounded-full border bg-background px-2 py-0.5 text-xs shadow-sm",
                    reactedByCurrentUser && "border-primary bg-primary/10"
                  )}
                >
                  <span>{reaction.icon}</span>
                  <span className="ml-1">{users.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
