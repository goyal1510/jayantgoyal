export type OrbitNotificationPreferences = {
  email: {
    mentions: boolean;
    assignments: boolean;
    dueDateReminders: boolean;
    weeklyDigest: boolean;
  };
  inApp: {
    mentions: boolean;
    assignments: boolean;
    boardActivity: boolean;
  };
};

export const defaultNotificationPreferences = (): OrbitNotificationPreferences => ({
  email: {
    mentions: true,
    assignments: true,
    dueDateReminders: false,
    weeklyDigest: false,
  },
  inApp: {
    mentions: true,
    assignments: true,
    boardActivity: true,
  },
});

/** Merges stored JSON with Orbit defaults for missing keys. */
export function parseNotificationPreferences(
  value: Record<string, unknown> | null | undefined,
): OrbitNotificationPreferences {
  const defaults = defaultNotificationPreferences();
  const email = (value?.email as Record<string, unknown> | undefined) ?? {};
  const inApp = (value?.in_app as Record<string, unknown> | undefined) ?? {};

  return {
    email: {
      mentions: typeof email.mentions === "boolean" ? email.mentions : defaults.email.mentions,
      assignments:
        typeof email.assignments === "boolean" ? email.assignments : defaults.email.assignments,
      dueDateReminders:
        typeof email.due_date_reminders === "boolean"
          ? email.due_date_reminders
          : defaults.email.dueDateReminders,
      weeklyDigest:
        typeof email.weekly_digest === "boolean" ? email.weekly_digest : defaults.email.weeklyDigest,
    },
    inApp: {
      mentions: typeof inApp.mentions === "boolean" ? inApp.mentions : defaults.inApp.mentions,
      assignments:
        typeof inApp.assignments === "boolean" ? inApp.assignments : defaults.inApp.assignments,
      boardActivity:
        typeof inApp.board_activity === "boolean"
          ? inApp.board_activity
          : defaults.inApp.boardActivity,
    },
  };
}

/** Serializes UI preferences to the stored JSON contract. */
export function serializeNotificationPreferences(
  preferences: OrbitNotificationPreferences,
): Record<string, unknown> {
  return {
    email: {
      mentions: preferences.email.mentions,
      assignments: preferences.email.assignments,
      due_date_reminders: preferences.email.dueDateReminders,
      weekly_digest: preferences.email.weeklyDigest,
    },
    in_app: {
      mentions: preferences.inApp.mentions,
      assignments: preferences.inApp.assignments,
      board_activity: preferences.inApp.boardActivity,
    },
  };
}
