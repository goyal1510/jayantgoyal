import Link from "next/link";
import { Archive, Inbox, Settings, Users } from "lucide-react";

import { Button } from "@jayantgoyal/web-ui/button";

type BoardToolbarProps = {
  boardId: string;
  workspaceId: string;
  boardKey: string;
  boardName: string;
  cardCount: number;
  columnCount: number;
};

export function BoardToolbar({
  boardId,
  workspaceId,
  boardKey,
  boardName,
  cardCount,
  columnCount,
}: BoardToolbarProps) {
  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-background to-background p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {boardKey}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{boardName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cardCount} cards · {columnCount} columns
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/boards/${boardId}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/boards/${boardId}/archive`}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/workspaces/${workspaceId}/members`}>
              <Users className="mr-2 h-4 w-4" />
              Members
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/inbox">
              <Inbox className="mr-2 h-4 w-4" />
              Inbox
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
