"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useInboxRealtime } from "@/lib/orbit/use-inbox-realtime";

import { Button } from "@jayantgoyal/web-ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/server/commands/actions";
import type { NotificationSummary } from "@/lib/orbit/types";

type InboxPanelProps = {
  userId: string;
  notifications: NotificationSummary[];
};

export function InboxPanel({ userId, notifications }: InboxPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useInboxRealtime(userId);

  function markRead(id: string) {
    startTransition(async () => {
      const result = await markNotificationReadAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function markAllRead() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Inbox cleared");
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All caught up</CardTitle>
          <CardDescription>
            New mentions, assignments, and activity will appear here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" disabled={pending} onClick={markAllRead}>
          Mark all read
        </Button>
      </div>
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={notification.readAt ? "opacity-70" : undefined}
        >
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{notification.reason}</CardTitle>
              <CardDescription>
                {notification.subjectType} ·{" "}
                {new Date(notification.createdAt).toLocaleString()}
              </CardDescription>
            </div>
            {!notification.readAt ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => markRead(notification.id)}
              >
                Mark read
              </Button>
            ) : null}
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
