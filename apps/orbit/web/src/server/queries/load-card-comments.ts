"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listCardComments } from "@/server/queries/boards";

/** Loads comments for one card when the detail panel opens. */
export async function loadCardCommentsAction(cardId: string) {
  const supabase = await createSupabaseServerClient();
  const comments = await listCardComments(supabase, cardId);
  return { ok: true as const, comments };
}
