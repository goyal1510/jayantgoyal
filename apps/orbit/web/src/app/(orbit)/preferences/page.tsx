import Link from "next/link";
import { notFound } from "next/navigation";

import { NotificationPreferencesPanel } from "@/features/orbit/notification-preferences-panel";
import { OrbitPageHeader } from "@/features/orbit/orbit-page-header";
import { parseNotificationPreferences } from "@/lib/orbit/notification-preferences";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PreferencesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data, error } = await supabase
    .schema("orbit")
    .from("user_preferences")
    .select("notification_preferences")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  const preferences = parseNotificationPreferences(
    data?.notification_preferences as Record<string, unknown> | null | undefined,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <OrbitPageHeader
        title="Notification preferences"
        description="Control in-app and email categories for mentions, assignments, reminders, and digests."
        actions={
          <Link
            href="/inbox"
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted"
          >
            Back to inbox
          </Link>
        }
      />
      <NotificationPreferencesPanel preferences={preferences} />
    </div>
  );
}
