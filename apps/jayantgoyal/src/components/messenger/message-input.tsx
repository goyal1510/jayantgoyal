"use client";

import * as React from "react";
import { Button } from "@repo/ui/button";
import { Textarea } from "@repo/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import { Code2, FileIcon, MessageSquare, Paperclip, Send, X } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { formatFileSize } from "@/lib/file-manager/format-utils";

export interface PendingMessengerAttachment {
  id: string;
  bucket_id: string;
  storage_path: string;
  name: string;
  original_name?: string;
  mime_type: string;
  size_bytes: number;
}

interface MessageInputProps {
  onSend: (
    content: string,
    messageType: "text" | "code",
    language?: string,
    attachments?: PendingMessengerAttachment[]
  ) => Promise<boolean>;
  onUploadAttachment?: (file: File) => Promise<PendingMessengerAttachment | null>;
  onTyping?: () => void;
  disabled?: boolean;
  compact?: boolean;
  placeholder?: string;
}

const CODE_LANGUAGES = [
  { value: "bash", label: "Bash" },
  { value: "c", label: "C" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "css", label: "CSS" },
  { value: "go", label: "Go" },
  { value: "html", label: "HTML" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "json", label: "JSON" },
  { value: "kotlin", label: "Kotlin" },
  { value: "markdown", label: "Markdown" },
  { value: "php", label: "PHP" },
  { value: "text", label: "Plain Text" },
  { value: "python", label: "Python" },
  { value: "ruby", label: "Ruby" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "swift", label: "Swift" },
  { value: "typescript", label: "TypeScript" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
];

export function MessageInput({
  onSend,
  onUploadAttachment,
  onTyping,
  disabled = false,
  compact = false,
  placeholder,
}: MessageInputProps) {
  const [content, setContent] = React.useState("");
  const [messageType, setMessageType] = React.useState<"text" | "code">("text");
  const [language, setLanguage] = React.useState<string>("text");
  const [isSending, setIsSending] = React.useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = React.useState(false);
  const [attachments, setAttachments] = React.useState<PendingMessengerAttachment[]>([]);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const lastTypingAtRef = React.useRef(0);

  const handleSend = React.useCallback(async () => {
    if ((!content.trim() && attachments.length === 0) || isSending || disabled) return;

    setIsSending(true);
    const success = await onSend(
      content.trim(),
      messageType,
      messageType === "code" ? language : undefined,
      attachments
    );

    if (success) {
      setContent("");
      setMessageType("text");
      setLanguage("text");
      setAttachments([]);
    }
    setIsSending(false);
  }, [attachments, content, messageType, language, onSend, isSending, disabled]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleContentChange = React.useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(event.target.value);

      const now = Date.now();
      if (onTyping && now - lastTypingAtRef.current > 1200) {
        lastTypingAtRef.current = now;
        onTyping();
      }
    },
    [onTyping]
  );

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []).slice(
        0,
        Math.max(0, 5 - attachments.length)
      );

      event.target.value = "";

      if (!onUploadAttachment || files.length === 0) return;

      setIsUploadingAttachment(true);
      try {
        const uploaded: PendingMessengerAttachment[] = [];

        for (const file of files) {
          const attachment = await onUploadAttachment(file);
          if (attachment) {
            uploaded.push(attachment);
          }
        }

        if (uploaded.length > 0) {
          setAttachments((current) => [...current, ...uploaded].slice(0, 5));
        }
      } finally {
        setIsUploadingAttachment(false);
      }
    },
    [attachments.length, onUploadAttachment]
  );

  return (
    <div className={cn("flex flex-col gap-3", compact && "gap-2")}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={messageType === "text" ? "default" : "outline"}
          size="sm"
          onClick={() => setMessageType("text")}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Text
        </Button>
        <Button
          type="button"
          variant={messageType === "code" ? "default" : "outline"}
          size="sm"
          onClick={() => setMessageType("code")}
          className="flex items-center gap-2"
        >
          <Code2 className="h-4 w-4" />
          Code
        </Button>
        {messageType === "code" && (
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className={compact ? "h-9 w-[150px]" : "w-[180px]"}>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {CODE_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {onUploadAttachment && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isSending || isUploadingAttachment || attachments.length >= 5}
              className="flex items-center gap-2"
            >
              <Paperclip className="h-4 w-4" />
              {isUploadingAttachment ? "Uploading" : "Attach"}
            </Button>
          </>
        )}
      </div>
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex max-w-full items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-xs"
            >
              <FileIcon className="h-3.5 w-3.5 flex-none text-muted-foreground" />
              <span className="truncate">{attachment.name}</span>
              <span className="flex-none text-muted-foreground">
                {formatFileSize(attachment.size_bytes)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 flex-none"
                onClick={() =>
                  setAttachments((current) =>
                    current.filter((item) => item.id !== attachment.id)
                  )
                }
                disabled={isSending}
                aria-label={`Remove ${attachment.name}`}
                title={`Remove ${attachment.name}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown}
        aria-label={placeholder ?? "Message"}
        placeholder={
          placeholder ??
          (messageType === "code"
            ? "Paste your code here (indentation will be preserved)..."
            : attachments.length > 0
              ? "Add a message about these files..."
              : "Type a message...")
        }
        className={cn(
          "resize-none",
          messageType === "code" && "font-mono",
          compact ? "min-h-12 max-h-36" : "min-h-[150px]"
        )}
        disabled={isSending || disabled}
      />
      <div className="flex items-center justify-end gap-2">
        <Button
          onClick={handleSend}
          disabled={(!content.trim() && attachments.length === 0) || isSending || disabled || isUploadingAttachment}
          size={compact ? "icon" : "default"}
          className={cn(!compact && "flex items-center gap-2")}
          aria-label={compact ? "Send message" : undefined}
          title={compact ? "Send message" : undefined}
        >
          <Send className="h-4 w-4" />
          {!compact && "Send"}
        </Button>
      </div>
    </div>
  );
}
