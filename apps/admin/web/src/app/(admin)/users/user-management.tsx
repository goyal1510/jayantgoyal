"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@jayantgoyal/web-ui/button";
import { ConfirmationDialog } from "@jayantgoyal/web-ui/confirmation-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";
import type { AdminRoleKey, Profile } from "@/lib/types";
import { AddUserDialog } from "./add-user-dialog";
import { UsersTable } from "./users-table";

interface AvailableUser {
  id: string;
  email: string;
  created_at: string;
}

interface UserManagementProps {
  currentUserId: string;
  canManageAccess: boolean;
}

export function UserManagement({
  currentUserId,
  canManageAccess,
}: UserManagementProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newRole, setNewRole] = useState<AdminRoleKey>("admin.viewer");
  const [addingUser, setAddingUser] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{
    userId: string;
    name: string;
  } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/users");
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to fetch users");
        return;
      }

      setProfiles(data.profiles || []);
      setAvailableUsers(data.availableUsers || []);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function updateRole(userId: string, role: AdminRoleKey) {
    if (userId === currentUserId) {
      toast.error("You cannot change your own role");
      return;
    }

    setActionLoading(userId);

    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update access");
        return;
      }

      toast.success(data.message);
      fetchUsers();
    } catch {
      toast.error("Failed to update role");
    } finally {
      setActionLoading(null);
    }
  }

  async function removeUser(userId: string) {
    if (userId === currentUserId) {
      toast.error("You cannot remove yourself");
      return;
    }

    setActionLoading(userId);

    try {
      const response = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to remove access");
        return;
      }

      toast.success(data.message);
      fetchUsers();
    } catch {
      toast.error("Failed to remove user");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setAddingUser(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selectedUserId, role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to add user");
        return;
      }

      toast.success(data.message);
      setSelectedUserId("");
      setNewRole("admin.viewer");
      setDialogOpen(false);
      fetchUsers();
    } catch {
      toast.error("Failed to add user");
    } finally {
      setAddingUser(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              {canManageAccess
                ? "View identities and manage Admin access"
                : "View identities and Admin access assignments"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {canManageAccess && (
              <Button
                size="sm"
                disabled={availableUsers.length === 0}
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Grant access
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found</p>
          ) : (
            <UsersTable
              profiles={profiles}
              currentUserId={currentUserId}
              canManageAccess={canManageAccess}
              actionLoading={actionLoading}
              onUpdateRole={updateRole}
              onRemoveUser={(userId) => {
                const profile = profiles.find(
                  (item) => item.user_id === userId,
                );
                setPendingRemoval({
                  userId,
                  name: profile
                    ? `${profile.first_name} ${profile.last_name}`.trim() ||
                      profile.email ||
                      "this user"
                    : "this user",
                });
              }}
            />
          )}
        </CardContent>
      </Card>

      <AddUserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        availableUsers={availableUsers}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        newRole={newRole}
        setNewRole={setNewRole}
        onSubmit={handleAddUser}
        adding={addingUser}
        disabled={!canManageAccess}
      />
      <ConfirmationDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
        title="Remove Admin access?"
        description={`This will revoke Admin membership and assigned Admin roles for ${pendingRemoval?.name ?? "this user"}.`}
        confirmLabel="Remove access"
        destructive
        onConfirm={() => {
          if (pendingRemoval) {
            return removeUser(pendingRemoval.userId);
          }
        }}
      />
    </div>
  );
}
