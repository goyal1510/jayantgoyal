"use client";

import { useState, useTransition } from "react";
import { Copy, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@jayantgoyal/web-ui/button";
import { Input } from "@jayantgoyal/web-ui/input";
import { Label } from "@jayantgoyal/web-ui/label";

import { createWorkspaceInvitationAction } from "@/server/commands/actions";

type InvitePanelProps = {
  workspaceId: string;
};

export function InvitePanel({ workspaceId }: InvitePanelProps) {
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "viewer" | "guest">("member");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  function handleInvite() {
    startTransition(async () => {
      const result = await createWorkspaceInvitationAction({
        workspaceId,
        email,
        role,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setInviteUrl(result.inviteUrl ?? null);
      toast.success("Invitation created");
      setEmail("");
    });
  }

  async function copyInviteLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied");
  }

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Mail className="h-4 w-4" aria-hidden />
        Invite teammate
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
        <div className="space-y-2">
          <Label htmlFor={`invite-email-${workspaceId}`}>Email</Label>
          <Input
            id={`invite-email-${workspaceId}`}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`invite-role-${workspaceId}`}>Role</Label>
          <select
            id={`invite-role-${workspaceId}`}
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as "member" | "viewer" | "guest")
            }
          >
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
            <option value="guest">Guest</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button
            disabled={pending || !email.includes("@")}
            onClick={handleInvite}
          >
            Invite
          </Button>
        </div>
      </div>
      {inviteUrl ? (
        <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3 text-sm">
          <p className="text-muted-foreground">
            Share this link with the invited email. It expires in 7 days.
          </p>
          <div className="flex gap-2">
            <Input readOnly value={inviteUrl} />
            <Button type="button" variant="outline" onClick={copyInviteLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
