"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@jayantgoyal/web-ui/button";
import { Label } from "@jayantgoyal/web-ui/label";

import type { OrbitNotificationPreferences } from "@/lib/orbit/notification-preferences";
import { updateNotificationPreferencesAction } from "@/server/commands/preferences-actions";

type NotificationPreferencesPanelProps = {
  preferences: OrbitNotificationPreferences;
};

function ToggleRow({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border px-3 py-3">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        id={id}
        type="checkbox"
        className="mt-1 h-4 w-4"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </div>
  );
}

export function NotificationPreferencesPanel({
  preferences: initialPreferences,
}: NotificationPreferencesPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preferences, setPreferences] = useState(initialPreferences);

  function save(next: OrbitNotificationPreferences) {
    setPreferences(next);
    startTransition(async () => {
      const result = await updateNotificationPreferencesAction(next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Notification preferences saved");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-semibold">In-app notifications</h2>
        <ToggleRow
          id="in-app-mentions"
          label="Mentions"
          description="Notify when someone mentions you on a card."
          checked={preferences.inApp.mentions}
          disabled={pending}
          onChange={(checked) =>
            save({ ...preferences, inApp: { ...preferences.inApp, mentions: checked } })
          }
        />
        <ToggleRow
          id="in-app-assignments"
          label="Assignments"
          description="Notify when you are assigned to a card."
          checked={preferences.inApp.assignments}
          disabled={pending}
          onChange={(checked) =>
            save({ ...preferences, inApp: { ...preferences.inApp, assignments: checked } })
          }
        />
        <ToggleRow
          id="in-app-activity"
          label="Board activity"
          description="Notify for watched cards and important board events."
          checked={preferences.inApp.boardActivity}
          disabled={pending}
          onChange={(checked) =>
            save({ ...preferences, inApp: { ...preferences.inApp, boardActivity: checked } })
          }
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Email notifications</h2>
        <p className="text-sm text-muted-foreground">
          Email delivery requires the outbox worker and Resend configuration. Preferences are stored
          now and honored when email is enabled.
        </p>
        <ToggleRow
          id="email-mentions"
          label="Mention emails"
          description="Send email when you are mentioned."
          checked={preferences.email.mentions}
          disabled={pending}
          onChange={(checked) =>
            save({ ...preferences, email: { ...preferences.email, mentions: checked } })
          }
        />
        <ToggleRow
          id="email-assignments"
          label="Assignment emails"
          description="Send email when you are assigned to a card."
          checked={preferences.email.assignments}
          disabled={pending}
          onChange={(checked) =>
            save({ ...preferences, email: { ...preferences.email, assignments: checked } })
          }
        />
        <ToggleRow
          id="email-due-dates"
          label="Due date reminders"
          description="Send reminders before card due dates."
          checked={preferences.email.dueDateReminders}
          disabled={pending}
          onChange={(checked) =>
            save({
              ...preferences,
              email: { ...preferences.email, dueDateReminders: checked },
            })
          }
        />
        <ToggleRow
          id="email-digest"
          label="Weekly digest"
          description="Opt in to a weekly workspace summary email."
          checked={preferences.email.weeklyDigest}
          disabled={pending}
          onChange={(checked) =>
            save({ ...preferences, email: { ...preferences.email, weeklyDigest: checked } })
          }
        />
      </section>

      <Button variant="outline" disabled={pending} onClick={() => save(preferences)}>
        Save preferences
      </Button>
    </div>
  );
}
