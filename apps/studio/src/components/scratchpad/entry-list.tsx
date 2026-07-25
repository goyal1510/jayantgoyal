"use client";

import * as React from "react";
import { EntryItem } from "@/components/scratchpad/entry-item";
import type { Database } from "@/lib/scratchpad/database.types";

type Entry = Database["scratchpad"]["Tables"]["entries"]["Row"];

interface EntryListProps {
  entries: Entry[];
}

export function EntryList({ entries }: EntryListProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {entries.map((entry) => (
        <EntryItem key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
