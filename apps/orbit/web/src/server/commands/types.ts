export type ActionResult =
  | { ok: true; id?: string; inviteUrl?: string; workspaceId?: string; url?: string }
  | { ok: false; error: string };
