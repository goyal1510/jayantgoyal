"use client";

import * as React from "react";
import { MessageItem } from "@/components/messenger/message-item";
import type { Database } from "@/lib/messenger/database.types";
import type { MessengerParticipant } from "@/lib/messenger/server";

type Message = Database["messenger"]["Tables"]["messages"]["Row"];

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  participants: MessengerParticipant[];
  onEditMessage: (messageId: string, content: string) => Promise<boolean>;
  onDeleteMessage: (messageId: string) => Promise<boolean>;
  onReactToMessage: (messageId: string, reaction: string) => Promise<boolean>;
}

export function MessageList({
  messages,
  currentUserId,
  participants,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
}: MessageListProps) {
  const participantByUserId = React.useMemo(
    () =>
      new Map(
        participants.map((participant) => [participant.user_id, participant])
      ),
    [participants]
  );

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          currentUserId={currentUserId}
          participant={participantByUserId.get(
            message.sender_id ?? message.user_id
          )}
          onEditMessage={onEditMessage}
          onDeleteMessage={onDeleteMessage}
          onReactToMessage={onReactToMessage}
        />
      ))}
    </div>
  );
}
