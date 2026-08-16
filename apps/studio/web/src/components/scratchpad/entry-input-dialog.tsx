"use client";

import * as React from "react";
import { Button } from "@jayantgoyal/web-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@jayantgoyal/web-ui/dialog";
import { EntryInput } from "@/components/scratchpad/entry-input";
import { Plus } from "lucide-react";

interface EntryInputDialogProps {
  onSend: (
    content: string,
    entryType: "text" | "code",
    language?: string,
  ) => Promise<boolean>;
  trigger?: React.ReactNode;
}

export function EntryInputDialog({ onSend, trigger }: EntryInputDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  const handleSend = React.useCallback(
    async (
      content: string,
      entryType: "text" | "code",
      language?: string,
    ): Promise<boolean> => {
      setIsSending(true);
      const success = await onSend(content, entryType, language);
      if (success) {
        setOpen(false);
      }
      setIsSending(false);
      return success;
    },
    [onSend],
  );

  const defaultTrigger = (
    <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
      <Plus className="h-6 w-6" />
      <span className="sr-only">New entry</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Entry</DialogTitle>
          <DialogDescription>
            Send a text entry or share code with proper formatting. Indentation
            will be preserved for code.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <EntryInput onSend={handleSend} disabled={isSending} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
