"use client";

import * as React from "react";
import { MessageItem } from "@/components/message-item";
import type { Database } from "@/lib/database.types";

type Message = Database["messenger"]["Tables"]["messages"]["Row"];

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
}
