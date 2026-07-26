"use client";

import * as React from "react";
import { EntryItem } from "@/components/scratchpad/entry-item";
import type { Database } from "@/lib/scratchpad/database.types";

type Entry = Database["scratchpad"]["Tables"]["entries"]["Row"];

interface EntryListProps {
  entries: Entry[];
  updatingEntryIds: Set<string>;
  onToggleRead: (entryId: string, nextIsRead: boolean) => void;
  onDelete: (entryId: string) => void;
}

export function EntryList({
  entries,
  updatingEntryIds,
  onToggleRead,
  onDelete,
}: EntryListProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {entries.map((entry) => (
        <EntryItem
          key={entry.id}
          entry={entry}
          isUpdating={updatingEntryIds.has(entry.id)}
          onToggleRead={onToggleRead}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
