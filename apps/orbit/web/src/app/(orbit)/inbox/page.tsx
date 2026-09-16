import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function InboxPage() {
  const supabase = await createSupabaseServerClient();
  const { data: notifications } = await supabase
    .schema("orbit")
    .from("notifications")
    .select("id, reason, created_at, read_at, subject_type")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          In-app notifications from your workspaces.
        </p>
      </div>
      {(notifications ?? []).length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All caught up</CardTitle>
            <CardDescription>
              New mentions, assignments, and activity will appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        (notifications ?? []).map((notification) => (
          <Card key={notification.id}>
            <CardHeader>
              <CardTitle className="text-base">{notification.reason}</CardTitle>
              <CardDescription>
                {notification.subject_type} ·{" "}
                {new Date(notification.created_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
          </Card>
        ))
      )}
    </div>
  );
}
