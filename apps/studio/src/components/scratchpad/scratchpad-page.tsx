"use client";

import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { EntryList } from "@/components/scratchpad/entry-list";
import { EntryInputDialog } from "@/components/scratchpad/entry-input-dialog";
import { PageSpinner } from "@repo/ui/page-spinner";
import type { Database } from "@/lib/scratchpad/database.types";
import { WorkspaceHeader } from "@repo/ui/workspace-header";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { MessageSquareText, Plus, Search } from "lucide-react";

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

  // Fetch initial entries using API route
  React.useEffect(() => {
    if (!userId) return;

    async function fetchEntries() {
      try {
        const response = await fetch("/api/scratchpad");
        if (!response.ok) {
          throw new Error("Failed to fetch entries");
        }
        const { entries: fetchedEntries } = await response.json();
        // API already returns newest first, so use as-is
        setEntries(fetchedEntries || []);
      } catch (error) {
        console.error("Error fetching entries:", error);
        // Fallback to direct Supabase call (also newest first)
        const { data, error: supabaseError } = await supabase
          .schema("jg_app")
          .from("scratchpad_entries")
          .select("*")
          .eq("user_id", userId)
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
  }, [userId, supabase]);

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
              item.id === updatedEntry.id
                ? { ...item, ...updatedEntry }
                : item,
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
    async (
      content: string,
      entryType: "text" | "code",
      language?: string,
    ) => {
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

        // Add the new entry to state immediately
        const { entry } = await response.json();
        if (entry) {
          setEntries((prev) => {
            // Avoid duplicates if realtime already added it
            if (prev.some((item) => item.id === entry.id)) {
              return prev;
            }
            return [entry, ...prev];
          });
        }

        return true;
      } catch (error) {
        console.error("Error sending entry:", error);
        return false;
      }
    },
    [],
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
            <EntryList entries={visibleEntries} />
          )}
        </div>
      </section>
    </div>
  );
}
