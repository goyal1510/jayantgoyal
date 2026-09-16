"use server";

import { revalidatePath } from "next/cache";

import {
  parseNotificationPreferences,
  serializeNotificationPreferences,
  type OrbitNotificationPreferences,
} from "@/lib/orbit/notification-preferences";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { ActionResult } from "./types";

export async function updateNotificationPreferencesAction(
  preferences: OrbitNotificationPreferences,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Sign in required" };

  const { error } = await supabase
    .schema("orbit")
    .from("user_preferences")
    .upsert({
      user_id: user.id,
      notification_preferences: serializeNotificationPreferences(preferences),
      updated_at: new Date().toISOString(),
    });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/preferences");
  revalidatePath("/inbox");
  return { ok: true };
}

export async function loadNotificationPreferencesAction(): Promise<
  { ok: true; preferences: OrbitNotificationPreferences } | { ok: false; error: string }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Sign in required" };

  const { data, error } = await supabase
    .schema("orbit")
    .from("user_preferences")
    .select("notification_preferences")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    preferences: parseNotificationPreferences(
      data?.notification_preferences as Record<string, unknown> | null | undefined,
    ),
  };
}
