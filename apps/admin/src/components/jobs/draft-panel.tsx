"use client";

import { Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@repo/ui/button";

export function DraftPanel({ title, body }: { title: string; body: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      toast.success(`${title} copied`);
    } catch {
      toast.error("Copy failed");
    }
  }
  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
          <Sparkles className="h-3 w-3" /> {title}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copy}
          className="h-6 px-2"
        >
          <Copy className="mr-1 h-3 w-3" /> Copy
        </Button>
      </div>
      <pre className="whitespace-pre-wrap text-sm leading-relaxed">{body}</pre>
    </div>
  );
}
