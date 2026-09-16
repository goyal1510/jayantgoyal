"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClientForOrbit } from "@/lib/supabase/browser";

/** Refreshes inbox when notifications change over Realtime. */
export function useInboxRealtime(userId: string) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClientForOrbit();
    const channel = supabase
      .channel(`orbit-inbox-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "orbit",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, router]);
}
