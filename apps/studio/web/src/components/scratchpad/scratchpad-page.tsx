"use client";

import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { EntryList } from "@/components/scratchpad/entry-list";
import { EntryInputDialog } from "@/components/scratchpad/entry-input-dialog";
import { PageSpinner } from "@jayantgoyal/web-ui/page-spinner";
import type { Database } from "@/lib/scratchpad/database.types";
import { WorkspaceHeader } from "@jayantgoyal/web-ui/workspace-header";
import { Button } from "@jayantgoyal/web-ui/button";
import { Input } from "@jayantgoyal/web-ui/input";
import { MessageSquareText, Plus, Search } from "lucide-react";
import { toast } from "sonner";

type Entry = Database["scratchpad"]["Tables"]["entries"]["Row"];
type EntryFilter = "all" | "unread" | "read";

export function ScratchpadPage() {
  // Memoize the client so it's only created once, preventing subscription recreation
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<EntryFilter>("all");
  const [query, setQuery] = React.useState("");
  const [updatingEntryIds, setUpdatingEntryIds] = React.useState<Set<string>>(
    new Set(),
  );

  // Fetch the initial entries and verified user ID in one authenticated request.
  React.useEffect(() => {
    async function fetchEntries() {
      try {
        const response = await fetch("/api/scratchpad");
        if (!response.ok) {
          throw new Error("Failed to fetch entries");
        }
        const { entries: fetchedEntries, userId: verifiedUserId } =
          await response.json();
        // API already returns newest first, so use as-is
        setEntries(fetchedEntries || []);
        setUserId(verifiedUserId);
      } catch (error) {
        console.error("Error fetching entries:", error);
        // Fallback to a direct authenticated Supabase query (also newest first).
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Supabase fallback auth error:", userError);
          setLoading(false);
          return;
        }

        setUserId(user.id);
        const { data, error: supabaseError } = await supabase
          .schema("jg_app")
          .from("scratchpad_entries")
          .select(
            "id,user_id,content,entry_type,language,created_at,updated_at,is_read",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (supabaseError) {
          console.error("Supabase fallback error:", supabaseError);
        } else {
          setEntries(data || []);
        }
      }
      setLoading(false);
    }

    fetchEntries();
  }, [supabase]);

  // Subscribe to real-time updates
  React.useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`entries-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "jg_app",
          table: "scratchpad_entries",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newEntry = payload.new as Entry;
          setEntries((prev) => {
            if (prev.some((item) => item.id === newEntry.id)) {
              return prev;
            }
            return [newEntry, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "jg_app",
          table: "scratchpad_entries",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedEntry = payload.new as Entry;
          setEntries((prev) =>
            prev.map((item) =>
              item.id === updatedEntry.id ? { ...item, ...updatedEntry } : item,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "jg_app",
          table: "scratchpad_entries",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const oldEntry = payload.old as { id: string };
          setEntries((prev) => prev.filter((item) => item.id !== oldEntry.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const handleCreateEntry = React.useCallback(
    async (content: string, entryType: "text" | "code", language?: string) => {
      const optimisticId = `optimistic-${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const optimisticEntry: Entry = {
        id: optimisticId,
        user_id: userId ?? "",
        content: content.trim(),
        entry_type: entryType,
        language: entryType === "code" ? language || null : null,
        created_at: now,
        updated_at: now,
        is_read: false,
      };

      setEntries((prev) => [optimisticEntry, ...prev]);

      void (async () => {
        try {
          const response = await fetch("/api/scratchpad", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content,
              entry_type: entryType,
              language: entryType === "code" ? language : null,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to send entry");
          }

          const { entry } = (await response.json()) as { entry?: Entry };
          if (entry) {
            setEntries((prev) => [
              entry,
              ...prev.filter(
                (item) => item.id !== optimisticId && item.id !== entry.id,
              ),
            ]);
          }
        } catch (error) {
          console.error("Error sending entry:", error);
          setEntries((prev) =>
            prev.filter((entry) => entry.id !== optimisticId),
          );
          toast.error("Unable to save the scratchpad entry.");
        }
      })();

      return true;
    },
    [userId],
  );

  const handleToggleRead = React.useCallback(
    async (entryId: string, nextIsRead: boolean) => {
      if (updatingEntryIds.has(entryId)) return;
      const previousEntry = entries.find((entry) => entry.id === entryId);
      if (!previousEntry) return;

      setUpdatingEntryIds((prev) => new Set(prev).add(entryId));
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, is_read: nextIsRead } : entry,
        ),
      );

      try {
        const response = await fetch(`/api/scratchpad/${entryId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_read: nextIsRead }),
        });

        if (!response.ok) {
          throw new Error("Failed to update entry.");
        }

        const { entry } = (await response.json()) as { entry?: Entry };
        if (entry) {
          setEntries((prev) =>
            prev.map((item) => (item.id === entryId ? entry : item)),
          );
        }
      } catch (error) {
        console.error("Failed to update is_read:", error);
        setEntries((prev) =>
          prev.map((entry) => (entry.id === entryId ? previousEntry : entry)),
        );
        toast.error("Unable to update the scratchpad entry.");
      } finally {
        setUpdatingEntryIds((prev) => {
          const next = new Set(prev);
          next.delete(entryId);
          return next;
        });
      }
    },
    [entries, updatingEntryIds],
  );

  const handleDeleteEntry = React.useCallback(
    async (entryId: string) => {
      if (!confirm("Delete this scratchpad entry?")) return;
      if (updatingEntryIds.has(entryId)) return;

      const previousIndex = entries.findIndex((entry) => entry.id === entryId);
      const previousEntry = entries[previousIndex];
      if (!previousEntry) return;

      setUpdatingEntryIds((prev) => new Set(prev).add(entryId));
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));

      try {
        const response = await fetch(`/api/scratchpad/${entryId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete entry.");
        }
      } catch (error) {
        console.error("Failed to delete entry:", error);
        setEntries((prev) => {
          if (prev.some((entry) => entry.id === entryId)) return prev;
          const restored = [...prev];
          restored.splice(previousIndex, 0, previousEntry);
          return restored;
        });
        toast.error("Unable to delete the scratchpad entry.");
      } finally {
        setUpdatingEntryIds((prev) => {
          const next = new Set(prev);
          next.delete(entryId);
          return next;
        });
      }
    },
    [entries, updatingEntryIds],
  );

  const unreadCount = entries.filter((entry) => !entry.is_read).length;
  const visibleEntries = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !entry.is_read) ||
        (filter === "read" && entry.is_read);
      const matchesQuery =
        !normalizedQuery ||
        entry.content?.toLowerCase().includes(normalizedQuery) ||
        entry.language?.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [filter, entries, query]);

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5">
      <WorkspaceHeader
        icon={MessageSquareText}
        title="Sync Scratchpad"
        description="Keep short notes, code fragments, and reusable snippets in one private, realtime stream."
        tone="lavender"
        actions={
          <EntryInputDialog
            onSend={handleCreateEntry}
            trigger={
              <Button className="h-11 rounded-xl bg-[#211512] px-5 text-[#fff8ef] shadow-none hover:bg-[#211512]/90 dark:bg-[#fff8ef] dark:text-[#211512] dark:hover:bg-[#fff8ef]/90">
                <Plus className="size-4" />
                New entry
              </Button>
            }
          />
        }
      />

      <section className="overflow-hidden rounded-[1.75rem] border border-border/80 bg-card">
        <div className="flex flex-col gap-4 border-b border-border/70 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" aria-label="Filter entries">
            {(
              [
                ["all", `All ${entries.length}`],
                ["unread", `Unread ${unreadCount}`],
                ["read", `Read ${entries.length - unreadCount}`],
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
              placeholder="Search entries"
              aria-label="Search entries"
              className="h-10 rounded-xl pl-9 shadow-none"
            />
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {loading ? (
            <PageSpinner />
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <p className="text-muted-foreground">
                No entries yet. Send your first entry!
              </p>
              <EntryInputDialog onSend={handleCreateEntry} />
            </div>
          ) : visibleEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="font-medium">No entries match this view.</p>
              <p className="text-sm text-muted-foreground">
                Try a different status or search term.
              </p>
            </div>
          ) : (
            <EntryList
              entries={visibleEntries}
              updatingEntryIds={updatingEntryIds}
              onToggleRead={handleToggleRead}
              onDelete={handleDeleteEntry}
            />
          )}
        </div>
      </section>
    </div>
  );
}
