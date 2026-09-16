"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@jayantgoyal/web-ui/badge";
import { Button } from "@jayantgoyal/web-ui/button";

import {
  removeWorkspaceMemberAction,
  updateWorkspaceMemberAction,
} from "@/server/commands/lifecycle-actions";
import type { MemberSummary } from "@/lib/orbit/types";

type MembersPanelProps = {
  workspaceId: string;
  members: MemberSummary[];
};

export function MembersPanel({ workspaceId, members }: MembersPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changeRole(userId: string, role: MemberSummary["role"]) {
    startTransition(async () => {
      const result = await updateWorkspaceMemberAction({
        workspaceId,
        userId,
        role: role as "admin" | "member" | "viewer" | "guest",
      });
      if (!result.ok) toast.error(result.error);
      else router.refresh();
    });
  }

  function removeMember(userId: string) {
    startTransition(async () => {
      const result = await removeWorkspaceMemberAction({ workspaceId, userId });
      if (!result.ok) toast.error(result.error);
      else {
        toast.success("Member removed");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.userId}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
        >
          <div>
            <p className="font-medium">{member.displayName}</p>
            <Badge variant="secondary">{member.status ?? "active"}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={member.role}
              disabled={pending}
              onChange={(event) => changeRole(member.userId, event.target.value)}
            >
              {["admin", "member", "viewer", "guest"].map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => removeMember(member.userId)}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
