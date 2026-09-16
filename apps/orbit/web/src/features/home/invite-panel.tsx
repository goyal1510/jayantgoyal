"use client";

import { useState, useTransition } from "react";
import { Copy, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@jayantgoyal/web-ui/button";
import { Input } from "@jayantgoyal/web-ui/input";
import { Label } from "@jayantgoyal/web-ui/label";

import { createWorkspaceInvitationAction } from "@/server/commands/actions";
import type { BoardSummary } from "@/lib/orbit/types";

type InvitePanelProps = {
  workspaceId: string;
  boards?: BoardSummary[];
};

export function InvitePanel({ workspaceId, boards = [] }: InvitePanelProps) {
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "viewer" | "guest">("member");
  const [boardScope, setBoardScope] = useState<string[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  function handleInvite() {
    startTransition(async () => {
      const result = await createWorkspaceInvitationAction({
        workspaceId,
        email,
        role,
        boardScope: role === "guest" ? boardScope : undefined,
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
            disabled={
              pending ||
              !email.includes("@") ||
              (role === "guest" && boardScope.length === 0)
            }
            onClick={handleInvite}
          >
            Invite
          </Button>
        </div>
      </div>
      {role === "guest" && boards.length > 0 ? (
        <div className="space-y-2">
          <Label>Board access</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {boards.map((board) => {
              const checked = boardScope.includes(board.id);
              return (
                <label
                  key={board.id}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      setBoardScope((current) =>
                        event.target.checked
                          ? [...current, board.id]
                          : current.filter((id) => id !== board.id),
                      );
                    }}
                  />
                  {board.name}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
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
