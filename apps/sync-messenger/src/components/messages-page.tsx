"use client";

import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MessageList } from "@/components/message-list";
import { MessageInputDialog } from "@/components/message-input-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function MessagesPage() {
  const supabase = createSupabaseBrowserClient();
  const [messages, setMessages] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userId, setUserId] = React.useState<string | null>(null);

  // Get user ID
  React.useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
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
        const response = await fetch("/api/messages");
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
          .schema("messenger")
          .from("messages")
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
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "messenger",
          table: "messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("[realtime] messages change", payload);
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? payload.new : msg
              )
            );
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const handleSendMessage = React.useCallback(
    async (content: string, messageType: "text" | "code", language?: string) => {
      try {
        const response = await fetch("/api/messages", {
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

        // The real-time subscription will automatically add the new message
        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        return false;
      }
    },
    []
  );

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <p className="text-muted-foreground">
              No messages yet. Send your first message!
            </p>
            <MessageInputDialog onSend={handleSendMessage} />
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>
      
      {/* Floating Plus Button */}
      <div className="absolute bottom-6 right-6">
        <MessageInputDialog onSend={handleSendMessage} />
      </div>
    </div>
  );
}
