import { InboxPanel } from "@/features/inbox/inbox-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NotificationSummary } from "@/lib/orbit/types";

export default async function InboxPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: notifications } = await supabase
    .schema("orbit")
    .from("notifications")
    .select("id, reason, created_at, read_at, subject_type")
    .order("created_at", { ascending: false })
    .limit(20);

  const summaries: NotificationSummary[] = (notifications ?? []).map(
    (notification) => ({
      id: notification.id as string,
      reason: notification.reason as string,
      subjectType: notification.subject_type as string,
      createdAt: notification.created_at as string,
      readAt: (notification.read_at as string | null) ?? null,
    }),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          In-app notifications from your workspaces.
        </p>
      </div>
      <InboxPanel userId={user.id} notifications={summaries} />
    </div>
  );
}
