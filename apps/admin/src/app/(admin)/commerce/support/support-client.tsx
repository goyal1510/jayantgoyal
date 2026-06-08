"use client";

import * as React from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Textarea } from "@repo/ui/textarea";
import { cn } from "@repo/ui/lib/utils";
import { LifeBuoy, Loader2, MessageCircle, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { shortId } from "@/lib/commerce-format";

type SupportStatus = "open" | "pending" | "resolved";

interface SupportMessage {
  id: string;
  conversation_id: string | null;
  sender_id: string | null;
  user_id: string;
  content: string;
  message_type: "text" | "code";
  created_at: string;
  deleted_at: string | null;
}

interface SupportThread {
  id: string;
  title: string | null;
  status: SupportStatus;
  order_id: string | null;
  product_name: string;
  buyer_user_id: string;
  buyer_email: string | null;
  buyer_name: string;
  latest_message: SupportMessage | null;
  last_message_at: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

function formatDateTime(value: string | null) {
  if (!value) return "No replies";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusVariant(status: SupportStatus) {
  if (status === "resolved") return "secondary";
  if (status === "pending") return "outline";
  return "default";
}

function senderName(
  message: SupportMessage,
  profilesById: Map<string, Profile>,
  activeThread: SupportThread
) {
  const senderId = message.sender_id ?? message.user_id;
  if (senderId === activeThread.buyer_user_id) return activeThread.buyer_name;

  const profile = profilesById.get(senderId);
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  return name || "Support";
}

export function CommerceSupportClient() {
  const [threads, setThreads] = React.useState<SupportThread[]>([]);
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<SupportMessage[]>([]);
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [reply, setReply] = React.useState("");
  const [loadingThreads, setLoadingThreads] = React.useState(true);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const activeThread = React.useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [activeThreadId, threads]
  );

  const profilesById = React.useMemo(
    () => new Map(profiles.map((profile) => [profile.user_id, profile])),
    [profiles]
  );

  const loadThreads = React.useCallback(async (preferredThreadId?: string | null) => {
    const response = await fetch("/api/commerce/support");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load support threads");
    }

    const nextThreads = (payload.data ?? []) as SupportThread[];
    setThreads(nextThreads);
    setActiveThreadId((current) => {
      if (preferredThreadId && nextThreads.some((thread) => thread.id === preferredThreadId)) {
        return preferredThreadId;
      }
      if (current && nextThreads.some((thread) => thread.id === current)) {
        return current;
      }
      return nextThreads[0]?.id ?? null;
    });
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadingThreads(true);
        await loadThreads();
      } catch (error) {
        if (!cancelled) {
          console.error("Support thread load failed:", error);
          toast.error("Unable to load support threads");
        }
      } finally {
        if (!cancelled) setLoadingThreads(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [loadThreads]);

  React.useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      setProfiles([]);
      return;
    }

    const controller = new AbortController();

    async function loadMessages() {
      try {
        setLoadingMessages(true);
        const response = await fetch(
          `/api/commerce/support/${activeThreadId}/messages`,
          { signal: controller.signal }
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load support messages");
        }

        setMessages(payload.messages ?? []);
        setProfiles(payload.profiles ?? []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Support message load failed:", error);
          toast.error("Unable to load support messages");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingMessages(false);
      }
    }

    loadMessages();
    return () => controller.abort();
  }, [activeThreadId]);

  async function sendReply() {
    if (!activeThread || !reply.trim()) return;

    try {
      setSending(true);
      const response = await fetch(`/api/commerce/support/${activeThread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to send reply");
      }

      setReply("");
      setMessages((current) => [...current, payload.message as SupportMessage]);
      await loadThreads(activeThread.id);
    } catch (error) {
      console.error("Support reply failed:", error);
      toast.error(error instanceof Error ? error.message : "Unable to send reply");
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(status: SupportStatus) {
    if (!activeThread || activeThread.status === status) return;

    try {
      const response = await fetch(`/api/commerce/support/${activeThread.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update status");
      }

      setThreads((current) =>
        current.map((thread) =>
          thread.id === activeThread.id ? { ...thread, status } : thread
        )
      );
    } catch (error) {
      console.error("Support status update failed:", error);
      toast.error(error instanceof Error ? error.message : "Unable to update status");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Commerce support</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Purchase-linked conversations only. Private user messages are not listed here.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadThreads(activeThreadId).catch(() => toast.error("Refresh failed"))}
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-lg border lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="min-h-0 border-b bg-muted/20 lg:border-b-0 lg:border-r">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <span className="text-sm font-medium">{threads.length} threads</span>
            <LifeBuoy className="size-4 text-muted-foreground" />
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-2">
            {loadingThreads ? (
              <div className="flex min-h-40 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : threads.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <MessageCircle className="size-8" />
                No support threads yet.
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setActiveThreadId(thread.id)}
                    className={cn(
                      "rounded-md p-3 text-left transition-colors",
                      thread.id === activeThreadId ? "bg-background shadow-sm" : "hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-medium">
                        {thread.product_name}
                      </span>
                      <Badge variant={statusVariant(thread.status)} className="capitalize">
                        {thread.status}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {thread.buyer_name}
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {thread.latest_message?.content ?? "No messages yet"}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>{thread.order_id ? shortId(thread.order_id) : "No order"}</span>
                      <span>{formatDateTime(thread.last_message_at ?? thread.created_at)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          {activeThread ? (
            <>
              <div className="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold">
                      {activeThread.product_name}
                    </h2>
                    <Badge variant={statusVariant(activeThread.status)} className="capitalize">
                      {activeThread.status}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {activeThread.buyer_email ?? activeThread.buyer_name}
                    {activeThread.order_id ? ` · Order ${shortId(activeThread.order_id)}` : ""}
                  </p>
                </div>
                <select
                  value={activeThread.status}
                  onChange={(event) => updateStatus(event.target.value as SupportStatus)}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  aria-label="Support status"
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
                {loadingMessages ? (
                  <div className="flex min-h-60 items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex min-h-60 items-center justify-center text-sm text-muted-foreground">
                    No messages in this support thread.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {messages.map((message) => {
                      const fromBuyer =
                        (message.sender_id ?? message.user_id) === activeThread.buyer_user_id;
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "max-w-[78%] rounded-lg border px-3 py-2",
                            fromBuyer ? "self-start bg-muted/40" : "self-end bg-primary text-primary-foreground"
                          )}
                        >
                          <div className="mb-1 flex items-center justify-between gap-4 text-[11px] opacity-75">
                            <span>{senderName(message, profilesById, activeThread)}</span>
                            <span>{formatDateTime(message.created_at)}</span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t p-4">
                <Textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Reply to this buyer"
                  className="min-h-24 resize-none"
                  maxLength={2000}
                />
                <div className="mt-3 flex justify-end">
                  <Button onClick={sendReply} disabled={sending || !reply.trim()}>
                    {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    Send reply
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-80 flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
              <MessageCircle className="size-10" />
              Select a support thread.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
