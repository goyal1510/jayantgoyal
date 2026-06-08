"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Separator } from "@repo/ui/separator";
import { MessageCircle, Plus, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import { MessageInput } from "@/components/messenger/message-input";
import type { PendingMessengerAttachment } from "@/components/messenger/message-input";
import { MessageList } from "@/components/messenger/message-list";
import { PageSpinner } from "@/components/ui/page-spinner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@repo/ui/lib/utils";
import type { Database } from "@/lib/messenger/database.types";
import type {
  ConversationSummary,
  MessengerParticipant,
} from "@/lib/messenger/server";

type Message = Database["messenger"]["Tables"]["messages"]["Row"];

interface Contact {
  user_id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  is_self: boolean;
}

function initials(name: string) {
  const value = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return value || "JG";
}

function formatConversationTime(value: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function lastMessagePreview(conversation: ConversationSummary) {
  if (!conversation.last_message) return "No messages yet";
  if (conversation.last_message.deleted_at) return "Message deleted";
  if (conversation.last_message.message_type === "code") return "Code snippet";

  return conversation.last_message.content;
}

function ConversationAvatar({
  conversation,
  currentUserId,
}: {
  conversation: ConversationSummary;
  currentUserId: string;
}) {
  const otherParticipant = conversation.participants.find(
    (participant) => participant.user_id !== currentUserId
  );
  const participant =
    conversation.conversation_type === "self"
      ? conversation.participants.find(
          (item) => item.user_id === currentUserId
        )
      : otherParticipant;
  const label = conversation.display_title;

  return (
    <Avatar className="h-10 w-10">
      <AvatarImage src={participant?.profile?.avatar_url ?? undefined} />
      <AvatarFallback>{initials(label)}</AvatarFallback>
    </Avatar>
  );
}

function ContactPicker({
  onSelect,
}: {
  onSelect: (contact: Contact) => Promise<void>;
}) {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const controller = new AbortController();

    async function fetchContacts() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());

        const response = await fetch(`/api/messenger/contacts?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to search contacts");
        }

        const payload = await response.json();
        setContacts(payload.contacts ?? []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Contact search failed:", error);
          toast.error("Unable to search contacts");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    const timeout = window.setTimeout(fetchContacts, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people"
          className="pl-9"
        />
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <PageSpinner />
        ) : contacts.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
            No contacts found.
          </div>
        ) : (
          <div className="flex flex-col">
            {contacts.map((contact) => (
              <button
                key={contact.user_id}
                type="button"
                onClick={() => onSelect(contact)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={contact.avatar_url ?? undefined} />
                  <AvatarFallback>{initials(contact.display_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {contact.display_name}
                  </div>
                  {contact.is_self && (
                    <div className="text-xs text-muted-foreground">
                      Self chat
                    </div>
                  )}
                  {!contact.is_self && contact.email && (
                    <div className="truncate text-xs text-muted-foreground">
                      {contact.email}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MessagesPage() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [conversations, setConversations] = React.useState<
    ConversationSummary[]
  >([]);
  const [activeConversationId, setActiveConversationId] = React.useState<
    string | null
  >(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = React.useState(true);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [newConversationOpen, setNewConversationOpen] = React.useState(false);
  const [onlineUserIds, setOnlineUserIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [typingUserIds, setTypingUserIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const typingTimeoutsRef = React.useRef<Map<string, number>>(new Map());
  const presenceChannelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);

  const activeConversation = React.useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId
      ) ?? null,
    [activeConversationId, conversations]
  );

  const activeParticipants = activeConversation?.participants ?? [];

  const refreshConversations = React.useCallback(
    async (nextActiveConversationId?: string) => {
      const response = await fetch("/api/messenger/conversations");

      if (!response.ok) {
        throw new Error("Unable to load conversations");
      }

      const payload = await response.json();
      const nextConversations = (payload.conversations ??
        []) as ConversationSummary[];

      setConversations(nextConversations);
      setActiveConversationId((current) => {
        if (nextActiveConversationId) return nextActiveConversationId;
        if (current && nextConversations.some((item) => item.id === current)) {
          return current;
        }

        return nextConversations[0]?.id ?? null;
      });
    },
    []
  );

  React.useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserId(user?.id ?? null);
    }

    getUser();
  }, [supabase]);

  React.useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function loadConversations() {
      try {
        setLoadingConversations(true);
        await refreshConversations();
      } catch (error) {
        if (!cancelled) {
          console.error("Conversation load failed:", error);
          toast.error("Unable to load conversations");
        }
      } finally {
        if (!cancelled) setLoadingConversations(false);
      }
    }

    loadConversations();

    return () => {
      cancelled = true;
    };
  }, [refreshConversations, userId]);

  React.useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const conversationId = activeConversationId;
    const controller = new AbortController();

    async function loadMessages() {
      try {
        setLoadingMessages(true);
        const response = await fetch(
          `/api/messenger/conversations/${conversationId}/messages`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Unable to load messages");
        }

        const payload = await response.json();
        setMessages(payload.messages ?? []);
        await refreshConversations(conversationId);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Message load failed:", error);
          toast.error("Unable to load messages");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingMessages(false);
      }
    }

    loadMessages();

    return () => {
      controller.abort();
    };
  }, [activeConversationId, refreshConversations]);

  React.useEffect(() => {
    if (!activeConversationId) return;

    const channel = supabase
      .channel(`messenger-thread-${activeConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "jg_app",
          table: "messenger_messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        async (payload) => {
          const nextMessage = payload.new as Message;
          setMessages((current) =>
            current.some((message) => message.id === nextMessage.id)
              ? current
              : [...current, nextMessage]
          );

          if (userId && nextMessage.sender_id !== userId) {
            try {
              const response = await fetch(
                `/api/messenger/conversations/${activeConversationId}/messages`
              );
              if (response.ok) {
                const messagePayload = await response.json();
                setMessages(messagePayload.messages ?? []);
              }
            } catch (error) {
              console.error("Active conversation read update failed:", error);
            }
          }

          refreshConversations(activeConversationId).catch(() => undefined);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "jg_app",
          table: "messenger_messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const nextMessage = payload.new as Message;
          setMessages((current) =>
            current.map((message) =>
              message.id === nextMessage.id ? nextMessage : message
            )
          );
          refreshConversations(activeConversationId).catch(() => undefined);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "jg_app",
          table: "messenger_messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const oldMessage = payload.old as { id: string };
          setMessages((current) =>
            current.filter((message) => message.id !== oldMessage.id)
          );
          refreshConversations(activeConversationId).catch(() => undefined);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, refreshConversations, supabase, userId]);

  React.useEffect(() => {
    if (!activeConversationId || !userId) return;

    const typingTimeouts = typingTimeoutsRef.current;

    typingTimeouts.forEach((timeoutId) =>
      window.clearTimeout(timeoutId)
    );
    typingTimeouts.clear();
    setTypingUserIds(new Set());

    const channel = supabase.channel(`messenger-presence-${activeConversationId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineUserIds(new Set(Object.keys(state)));
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const typingUserId =
          typeof payload.user_id === "string" ? payload.user_id : null;

        if (!typingUserId || typingUserId === userId) return;

        setTypingUserIds((current) => new Set(current).add(typingUserId));

        const existingTimeout = typingTimeoutsRef.current.get(typingUserId);
        if (existingTimeout) {
          window.clearTimeout(existingTimeout);
        }

        const timeoutId = window.setTimeout(() => {
          setTypingUserIds((current) => {
            const next = new Set(current);
            next.delete(typingUserId);
            return next;
          });
          typingTimeoutsRef.current.delete(typingUserId);
        }, 2500);

        typingTimeoutsRef.current.set(typingUserId, timeoutId);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      presenceChannelRef.current = null;
      typingTimeouts.forEach((timeoutId) =>
        window.clearTimeout(timeoutId)
      );
      typingTimeouts.clear();
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, supabase, userId]);

  const handleSelectContact = React.useCallback(
    async (contact: Contact) => {
      try {
        const response = await fetch("/api/messenger/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversation_type: contact.is_self ? "self" : "direct",
            participant_user_id: contact.user_id,
          }),
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error ?? "Unable to start conversation");
        }

        const payload = await response.json();
        setNewConversationOpen(false);
        await refreshConversations(payload.conversation?.id);
      } catch (error) {
        console.error("Conversation creation failed:", error);
        toast.error("Unable to start conversation");
      }
    },
    [refreshConversations]
  );

  const handleSendMessage = React.useCallback(
    async (
      content: string,
      messageType: "text" | "code",
      language?: string,
      attachments?: PendingMessengerAttachment[]
    ) => {
      if (!activeConversationId) return false;

      try {
        const response = await fetch(
          `/api/messenger/conversations/${activeConversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content,
              message_type: messageType,
              language: messageType === "code" ? language : null,
              attachments: attachments ?? [],
            }),
          }
        );

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error ?? "Unable to send message");
        }

        const payload = await response.json();
        if (payload.message) {
          setMessages((current) =>
            current.some((message) => message.id === payload.message.id)
              ? current
              : [...current, payload.message]
          );
        }
        await refreshConversations(activeConversationId);

        return true;
      } catch (error) {
        console.error("Message send failed:", error);
        toast.error("Unable to send message");
        return false;
      }
    },
    [activeConversationId, refreshConversations]
  );

  const handleUploadAttachment = React.useCallback(
    async (file: File) => {
      if (!activeConversationId) return null;

      try {
        const signedUrlResponse = await fetch(
          `/api/messenger/conversations/${activeConversationId}/attachments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type || "application/octet-stream",
            }),
          }
        );
        const signedUrlPayload = await signedUrlResponse.json();

        if (!signedUrlResponse.ok || !signedUrlPayload.success) {
          throw new Error(
            signedUrlPayload.error ?? "Unable to prepare attachment"
          );
        }

        const uploadResponse = await fetch(signedUrlPayload.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Unable to upload attachment");
        }

        return signedUrlPayload.attachment as PendingMessengerAttachment;
      } catch (error) {
        console.error("Attachment upload failed:", error);
        toast.error(error instanceof Error ? error.message : "Unable to upload attachment");
        return null;
      }
    },
    [activeConversationId]
  );

  const handleEditMessage = React.useCallback(
    async (messageId: string, content: string) => {
      try {
        const response = await fetch(`/api/messenger/${messageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error ?? "Unable to edit message");
        }

        const payload = await response.json();
        setMessages((current) =>
          current.map((message) =>
            message.id === messageId ? payload.message : message
          )
        );
        await refreshConversations(activeConversationId ?? undefined);

        return true;
      } catch (error) {
        console.error("Message edit failed:", error);
        toast.error("Unable to edit message");
        return false;
      }
    },
    [activeConversationId, refreshConversations]
  );

  const handleDeleteMessage = React.useCallback(
    async (messageId: string) => {
      try {
        const response = await fetch(`/api/messenger/${messageId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error ?? "Unable to delete message");
        }

        setMessages((current) =>
          current.filter((message) => message.id !== messageId)
        );
        await refreshConversations(activeConversationId ?? undefined);

        return true;
      } catch (error) {
        console.error("Message delete failed:", error);
        toast.error("Unable to delete message");
        return false;
      }
    },
    [activeConversationId, refreshConversations]
  );

  const handleReactToMessage = React.useCallback(
    async (messageId: string, reaction: string) => {
      try {
        const response = await fetch(`/api/messenger/${messageId}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reaction }),
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error ?? "Unable to update reaction");
        }

        const payload = await response.json();
        setMessages((current) =>
          current.map((message) =>
            message.id === messageId ? payload.message : message
          )
        );

        return true;
      } catch (error) {
        console.error("Message reaction failed:", error);
        toast.error("Unable to update reaction");
        return false;
      }
    },
    []
  );

  const handleTyping = React.useCallback(() => {
    presenceChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: userId,
      },
    });
  }, [userId]);

  const typingLabels = React.useMemo(() => {
    if (!activeConversation) return [];

    return activeConversation.participants
      .filter((participant) => typingUserIds.has(participant.user_id))
      .map((participant) => participant.display_label);
  }, [activeConversation, typingUserIds]);

  if (!userId) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col border-r bg-muted/20">
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div>
            <h1 className="text-base font-semibold">Messenger</h1>
            <p className="text-xs text-muted-foreground">
              {conversations.length} conversations
            </p>
          </div>
          <Dialog
            open={newConversationOpen}
            onOpenChange={setNewConversationOpen}
          >
            <DialogTrigger asChild>
              <Button
                size="icon"
                title="New conversation"
                aria-label="New conversation"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Conversation</DialogTitle>
              </DialogHeader>
              <ContactPicker onSelect={handleSelectContact} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {loadingConversations ? (
            <PageSpinner />
          ) : conversations.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
              <MessageCircle className="h-8 w-8" />
              <span>No conversations yet.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-md p-3 text-left transition-colors",
                    conversation.id === activeConversationId
                      ? "bg-background shadow-sm"
                      : "hover:bg-muted"
                  )}
                >
                  <ConversationAvatar
                    conversation={conversation}
                    currentUserId={userId}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {conversation.display_title}
                      </span>
                      {conversation.conversation_type === "self" && (
                        <Badge variant="secondary" className="shrink-0">
                          Self
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {lastMessagePreview(conversation)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      {formatConversationTime(
                        conversation.last_message_at ??
                          conversation.last_message?.created_at ??
                          conversation.created_at
                      )}
                    </span>
                    {conversation.unread_count > 0 && (
                      <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px]">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <section className="flex min-h-0 flex-col bg-background">
        {activeConversation ? (
          <>
            <div className="flex h-16 items-center justify-between border-b px-4">
              <div className="flex min-w-0 items-center gap-3">
                <ConversationAvatar
                  conversation={activeConversation}
                  currentUserId={userId}
                />
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">
                    {activeConversation.display_title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <UserRound className="h-3.5 w-3.5" />
                    <span>
                      {activeConversation.participants.length} participant
                      {activeConversation.participants.length === 1 ? "" : "s"}
                    </span>
                    {onlineUserIds.size > 0 && (
                      <span>{onlineUserIds.size} online</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
              {loadingMessages ? (
                <PageSpinner />
              ) : messages.length === 0 ? (
                <div className="flex min-h-full items-center justify-center text-sm text-muted-foreground">
                  Start the conversation.
                </div>
              ) : (
                <MessageList
                  messages={messages}
                  currentUserId={userId}
                  participants={activeParticipants as MessengerParticipant[]}
                  onEditMessage={handleEditMessage}
                  onDeleteMessage={handleDeleteMessage}
                  onReactToMessage={handleReactToMessage}
                />
              )}
            </div>

            <Separator />
            <div className="p-4">
              {typingLabels.length > 0 && (
                <div className="mb-2 text-xs text-muted-foreground">
                  {typingLabels.join(", ")} typing...
                </div>
              )}
              <MessageInput
                onSend={handleSendMessage}
                onUploadAttachment={handleUploadAttachment}
                onTyping={handleTyping}
                compact
                placeholder={`Message ${activeConversation.display_title}`}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-sm text-muted-foreground">
            <MessageCircle className="h-10 w-10" />
            <span>Select or create a conversation.</span>
          </div>
        )}
      </section>
    </div>
  );
}
