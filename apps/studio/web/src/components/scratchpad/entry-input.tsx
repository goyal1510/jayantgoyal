"use client";

import * as React from "react";
import { Button } from "@jayantgoyal/web-ui/button";
import { Textarea } from "@jayantgoyal/web-ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jayantgoyal/web-ui/select";
import { Code2, MessageSquare, Send } from "lucide-react";

interface EntryInputProps {
  onSend: (
    content: string,
    entryType: "text" | "code",
    language?: string,
  ) => Promise<boolean>;
  disabled?: boolean;
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

export function EntryInput({ onSend, disabled = false }: EntryInputProps) {
  const [content, setContent] = React.useState("");
  const [entryType, setEntryType] = React.useState<"text" | "code">("text");
  const [language, setLanguage] = React.useState<string>("text");
  const [isSending, setIsSending] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSend = React.useCallback(async () => {
    if (!content.trim() || isSending || disabled) return;

    setIsSending(true);
    const success = await onSend(
      content.trim(),
      entryType,
      entryType === "code" ? language : undefined,
    );

    if (success) {
      setContent("");
      setEntryType("text");
      setLanguage("text");
    }
    setIsSending(false);
  }, [content, entryType, language, onSend, isSending, disabled]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={entryType === "text" ? "default" : "outline"}
          size="sm"
          onClick={() => setEntryType("text")}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Text
        </Button>
        <Button
          type="button"
          variant={entryType === "code" ? "default" : "outline"}
          size="sm"
          onClick={() => setEntryType("code")}
          className="flex items-center gap-2"
        >
          <Code2 className="h-4 w-4" />
          Code
        </Button>
        {entryType === "code" && (
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
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setContent(e.target.value)
        }
        onKeyDown={handleKeyDown}
        placeholder={
          entryType === "code"
            ? "Paste your code here (indentation will be preserved)..."
            : "Type your entry here..."
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
