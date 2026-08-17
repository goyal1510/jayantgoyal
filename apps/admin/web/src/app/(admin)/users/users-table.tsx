"use client";

import { Loader2, Trash2 } from "lucide-react";
import { Badge } from "@jayantgoyal/web-ui/badge";
import { IconAction } from "@jayantgoyal/web-ui/icon-action";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jayantgoyal/web-ui/select";
import type { AdminRoleKey, Profile } from "@/lib/types";

const roleLabels: Record<AdminRoleKey, string> = {
  "admin.viewer": "Viewer",
  "admin.full_access": "Full access",
};

interface UsersTableProps {
  profiles: Profile[];
  currentUserId: string;
  canManageAccess: boolean;
  actionLoading: string | null;
  onUpdateRole: (userId: string, newRole: AdminRoleKey) => void;
  onRemoveUser: (userId: string) => void;
}

export function UsersTable({
  profiles,
  currentUserId,
  canManageAccess,
  actionLoading,
  onUpdateRole,
  onRemoveUser,
}: UsersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">Email</th>
            <th className="pb-3 pr-4 font-medium">First name</th>
            <th className="pb-3 pr-4 font-medium">Last name</th>
            <th className="pb-3 pr-4 font-medium">Admin access</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => {
            const isCurrentUser = profile.user_id === currentUserId;
            const isLoading = actionLoading === profile.user_id;

            return (
              <tr key={profile.user_id} className="border-b last:border-0">
                <td className="py-3 pr-4">
                  <span className="font-medium">
                    {profile.email || profile.user_id}
                  </span>
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (You)
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {profile.first_name || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {profile.last_name || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {profile.admin_role ? (
                    <Badge
                      variant={
                        profile.admin_role === "admin.full_access"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {roleLabels[profile.admin_role]}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">No access</Badge>
                  )}
                </td>
                <td className="py-3 text-right">
                  {canManageAccess && !isCurrentUser && (
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        value={profile.admin_role ?? undefined}
                        onValueChange={(value) =>
                          onUpdateRole(profile.user_id, value as AdminRoleKey)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue placeholder="Assign role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin.viewer">Viewer</SelectItem>
                          <SelectItem value="admin.full_access">
                            Full access
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {profile.admin_role && (
                        <IconAction
                          icon={isLoading ? Loader2 : Trash2}
                          iconClassName={
                            isLoading ? "size-3.5 animate-spin" : "size-3.5"
                          }
                          label={`Remove ${profile.email || "user"}`}
                          variant="destructive"
                          onClick={() => onRemoveUser(profile.user_id)}
                          disabled={isLoading}
                        />
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
