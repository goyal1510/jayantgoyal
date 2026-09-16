"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClientForOrbit } from "@/lib/supabase/browser";

/** Refreshes the board route when cards or comments change over Realtime. */
export function useBoardRealtime(boardId: string) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClientForOrbit();
    const channel = supabase
      .channel(`orbit-board-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "orbit",
          table: "cards",
          filter: `board_id=eq.${boardId}`,
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "orbit",
          table: "comments",
          filter: `board_id=eq.${boardId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [boardId, router]);
}
