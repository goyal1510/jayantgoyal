import Link from "next/link";
import { notFound } from "next/navigation";

import { BoardSettingsPanel } from "@/features/boards/board-settings-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadBoardView } from "@/server/queries/boards";

type SettingsPageProps = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardSettingsPage({ params }: SettingsPageProps) {
  const { boardId } = await params;
  const supabase = await createSupabaseServerClient();
  const { board, columns } = await loadBoardView(supabase, boardId);
  if (!board) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Board settings</h1>
          <p className="text-sm text-muted-foreground">{board.name}</p>
        </div>
        <Link href={`/boards/${boardId}`} className="text-sm text-primary underline">
          Back to board
        </Link>
      </div>
      <BoardSettingsPanel board={board} columns={columns} />
    </div>
  );
}
