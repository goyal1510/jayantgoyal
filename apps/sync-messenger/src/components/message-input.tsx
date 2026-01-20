"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code2, MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (content: string, messageType: "text" | "code", language?: string) => Promise<boolean>;
  disabled?: boolean;
}

const CODE_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "bash", label: "Bash" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "text", label: "Plain Text" },
];

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [content, setContent] = React.useState("");
  const [messageType, setMessageType] = React.useState<"text" | "code">("text");
  const [language, setLanguage] = React.useState<string>("text");
  const [isSending, setIsSending] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSend = React.useCallback(async () => {
    if (!content.trim() || isSending || disabled) return;

    setIsSending(true);
    const success = await onSend(
      content.trim(),
      messageType,
      messageType === "code" ? language : undefined
    );

    if (success) {
      setContent("");
      setMessageType("text");
      setLanguage("text");
    }
    setIsSending(false);
  }, [content, messageType, language, onSend, isSending, disabled]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
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
            <SelectTrigger className="w-[180px]">
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
      </div>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          messageType === "code"
            ? "Paste your code here (indentation will be preserved)..."
            : "Type your message here..."
        }
        className="min-h-[150px] resize-none font-mono"
        disabled={isSending || disabled}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Press Cmd/Ctrl + Enter to send
        </p>
        <Button
          onClick={handleSend}
          disabled={!content.trim() || isSending || disabled}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          Send
        </Button>
      </div>
    </div>
  );
}
