"use client";

import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MessageList } from "@/components/messenger/message-list";
import { MessageInputDialog } from "@/components/messenger/message-input-dialog";
import { PageSpinner } from "@repo/ui/page-spinner";
import type { Database } from "@/lib/messenger/database.types";
import { WorkspaceHeader } from "@repo/ui/workspace-header";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { MessageSquareText, Plus, Search } from "lucide-react";

type Message = Database["messenger"]["Tables"]["messages"]["Row"];
type MessageFilter = "all" | "unread" | "read";

export function MessagesPage() {
  // Memoize the client so it's only created once, preventing subscription recreation
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<MessageFilter>("all");
  const [query, setQuery] = React.useState("");

  // Get user ID
  React.useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    getUser();
  }, [supabase]);

  // Fetch initial messages using API route
  React.useEffect(() => {
    if (!userId) return;

    async function fetchMessages() {
      try {
        const response = await fetch("/api/messenger");
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }
        const { messages: fetchedMessages } = await response.json();
        // API already returns newest first, so use as-is
        setMessages(fetchedMessages || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        // Fallback to direct Supabase call (also newest first)
        const { data, error: supabaseError } = await supabase
          .schema("jg_app")
          .from("messenger_messages")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (supabaseError) {
          console.error("Supabase fallback error:", supabaseError);
        } else {
          setMessages(data || []);
        }
      }
      setLoading(false);
    }

    fetchMessages();
  }, [userId, supabase]);

  // Subscribe to real-time updates
  React.useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`messages-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "jg_app",
          table: "messenger_messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [newMessage, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "jg_app",
          table: "messenger_messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id
                ? { ...msg, ...updatedMessage }
                : msg,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "jg_app",
          table: "messenger_messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const oldMessage = payload.old as { id: string };
          setMessages((prev) => prev.filter((msg) => msg.id !== oldMessage.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const handleSendMessage = React.useCallback(
    async (
      content: string,
      messageType: "text" | "code",
      language?: string,
    ) => {
      try {
        const response = await fetch("/api/messenger", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            message_type: messageType,
            language: messageType === "code" ? language : null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to send message");
        }

        // Add the new message to state immediately
        const { message } = await response.json();
        if (message) {
          setMessages((prev) => {
            // Avoid duplicates if realtime already added it
            if (prev.some((m) => m.id === message.id)) {
              return prev;
            }
            return [message, ...prev];
          });
        }

        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        return false;
      }
    },
    [],
  );

  const unreadCount = messages.filter((message) => !message.is_read).length;
  const visibleMessages = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return messages.filter((message) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !message.is_read) ||
        (filter === "read" && message.is_read);
      const matchesQuery =
        !normalizedQuery ||
        message.content?.toLowerCase().includes(normalizedQuery) ||
        message.language?.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [filter, messages, query]);

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <WorkspaceHeader
        icon={MessageSquareText}
        title="Messenger"
        description="Keep short notes, code fragments, and reusable snippets in one private, realtime stream."
        tone="lavender"
        actions={
          <MessageInputDialog
            onSend={handleSendMessage}
            trigger={
              <Button className="h-11 rounded-xl bg-[#211512] px-5 text-[#fff8ef] shadow-none hover:bg-[#211512]/90 dark:bg-[#fff8ef] dark:text-[#211512] dark:hover:bg-[#fff8ef]/90">
                <Plus className="size-4" />
                New message
              </Button>
            }
          />
        }
      />

      <section className="overflow-hidden rounded-[1.75rem] border border-border/80 bg-card">
        <div className="flex flex-col gap-4 border-b border-border/70 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" aria-label="Filter messages">
            {(
              [
                ["all", `All ${messages.length}`],
                ["unread", `Unread ${unreadCount}`],
                ["read", `Read ${messages.length - unreadCount}`],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                variant={filter === value ? "default" : "outline"}
                size="sm"
                className="rounded-full px-4 shadow-none"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search messages"
              aria-label="Search messages"
              className="h-10 rounded-xl pl-9 shadow-none"
            />
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {loading ? (
            <PageSpinner />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <p className="text-muted-foreground">
                No messages yet. Send your first message!
              </p>
              <MessageInputDialog onSend={handleSendMessage} />
            </div>
          ) : visibleMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="font-medium">No messages match this view.</p>
              <p className="text-sm text-muted-foreground">
                Try a different status or search term.
              </p>
            </div>
          ) : (
            <MessageList messages={visibleMessages} />
          )}
        </div>
      </section>
    </div>
  );
}
