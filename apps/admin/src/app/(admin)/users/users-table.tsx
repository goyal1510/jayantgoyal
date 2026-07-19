"use client";

import { Check, X, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { IconAction } from "@repo/ui/icon-action";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import type { Profile, UserRole } from "@/lib/types";

const roleLabels: Record<UserRole, string> = {
  user: "User",
  admin: "Admin",
  super_admin: "Super Admin",
};

const roleBadgeVariant: Record<UserRole, "secondary" | "default" | "destructive"> = {
  user: "secondary",
  admin: "default",
  super_admin: "destructive",
};

interface UsersTableProps {
  profiles: Profile[];
  currentUserId: string;
  actionLoading: string | null;
  onUpdateRole: (profileId: number, userId: string, newRole: UserRole) => void;
  onRemoveUser: (profileId: number, userId: string) => void;
}

export function UsersTable({
  profiles,
  currentUserId,
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
            <th className="pb-3 pr-4 font-medium">First Name</th>
            <th className="pb-3 pr-4 font-medium">Last Name</th>
            <th className="pb-3 pr-4 font-medium">Role</th>
            <th className="pb-3 pr-4 font-medium">Terms Accepted</th>
            <th className="pb-3 pr-4 font-medium">Terms Accepted At</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => {
            const isCurrentUser = profile.user_id === currentUserId;
            const isLoading = actionLoading === String(profile.id);

            return (
              <tr key={profile.id} className="border-b last:border-0">
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
                  {profile.first_name || <span className="text-muted-foreground">—</span>}
                </td>
                <td className="py-3 pr-4">
                  {profile.last_name || <span className="text-muted-foreground">—</span>}
                </td>
                <td className="py-3 pr-4">
                  <Badge variant={roleBadgeVariant[profile.role]}>
                    {roleLabels[profile.role]}
                  </Badge>
                </td>
                <td className="py-3 pr-4">
                  {profile.terms_accepted ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {profile.terms_accepted_at
                    ? new Date(profile.terms_accepted_at).toLocaleDateString()
                    : <span>—</span>}
                </td>
                <td className="py-3 text-right">
                  {!isCurrentUser && (
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        value={profile.role}
                        onValueChange={(v) =>
                          onUpdateRole(profile.id, profile.user_id, v as UserRole)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <IconAction
                        icon={isLoading ? Loader2 : Trash2}
                        iconClassName={isLoading ? "size-3.5 animate-spin" : "size-3.5"}
                        label={`Remove ${profile.email || "user"}`}
                        variant="destructive"
                        onClick={() =>
                          onRemoveUser(profile.id, profile.user_id)
                        }
                        disabled={isLoading}
                      />
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
