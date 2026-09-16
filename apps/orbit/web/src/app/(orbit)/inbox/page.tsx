import Link from "next/link";

import { InboxPanel } from "@/features/inbox/inbox-panel";
import { OrbitPageHeader } from "@/features/orbit/orbit-page-header";
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
    <div className="mx-auto max-w-3xl space-y-6">
      <OrbitPageHeader
        title="Inbox"
        description="Assignment and activity notifications from your workspaces."
        actions={
          <Link
            href="/preferences"
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted"
          >
            Notification preferences
          </Link>
        }
      />
      <InboxPanel userId={user.id} notifications={summaries} />
    </div>
  );
}
