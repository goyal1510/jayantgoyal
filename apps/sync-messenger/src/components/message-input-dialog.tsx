"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageInput } from "@/components/message-input";
import { Plus } from "lucide-react";

interface MessageInputDialogProps {
  onSend: (content: string, messageType: "text" | "code", language?: string) => Promise<boolean>;
  trigger?: React.ReactNode;
}

export function MessageInputDialog({ onSend, trigger }: MessageInputDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  const handleSend = React.useCallback(
    async (content: string, messageType: "text" | "code", language?: string) => {
      setIsSending(true);
      const success = await onSend(content, messageType, language);
      if (success) {
        setOpen(false);
      }
      setIsSending(false);
    },
    [onSend]
  );

  const defaultTrigger = (
    <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
      <Plus className="h-6 w-6" />
      <span className="sr-only">New message</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Send a text message or share code with proper formatting. Indentation will be preserved for code.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <MessageInput onSend={handleSend} disabled={isSending} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
