"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Shield,
  ShieldCheck,
  User,
  Trash2,
  Plus,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile, UserRole } from "@/lib/types";

interface AvailableUser {
  id: string;
  email: string;
  created_at: string;
}

interface UserManagementProps {
  currentUserId: string;
}

const roleLabels: Record<UserRole, string> = {
  user: "User",
  admin: "Admin",
  super_admin: "Super Admin",
};

const roleIcons: Record<UserRole, typeof User> = {
  user: User,
  admin: Shield,
  super_admin: ShieldCheck,
};

export function UserManagement({ currentUserId }: UserManagementProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add user form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "super_admin">("admin");
  const [addingUser, setAddingUser] = useState(false);

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

  async function updateRole(
    profileId: number,
    userId: string,
    newRole: UserRole
  ) {
    if (userId === currentUserId) {
      toast.error("You cannot change your own role");
      return;
    }

    setActionLoading(String(profileId));

    try {
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase
        .schema("portfolio")
        .from("profile")
        .update({ role: newRole })
        .eq("id", profileId);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Role updated to ${roleLabels[newRole]}`);
      fetchUsers();
    } catch {
      toast.error("Failed to update role");
    } finally {
      setActionLoading(null);
    }
  }

  async function removeUser(profileId: number, userId: string) {
    if (userId === currentUserId) {
      toast.error("You cannot remove yourself");
      return;
    }

    if (!confirm("Are you sure you want to remove this user's admin access?")) {
      return;
    }

    setActionLoading(String(profileId));

    try {
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase
        .schema("portfolio")
        .from("profile")
        .update({ role: "user" })
        .eq("id", profileId);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("User access removed");
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
      setNewRole("admin");
      fetchUsers();
    } catch {
      toast.error("Failed to add user");
    } finally {
      setAddingUser(false);
    }
  }

  const admins = profiles.filter((p) =>
    ["admin", "super_admin"].includes(p.role)
  );
  const users = profiles.filter((p) => p.role === "user");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Admin User
          </CardTitle>
          <CardDescription>
            Add an existing user as an administrator. The user must have already
            signed up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No users available to add. All existing users already have admin
              profiles.
            </p>
          ) : (
            <form onSubmit={handleAddUser} className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="user">Select User</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={addingUser}
                >
                  <SelectTrigger id="user">
                    <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40 space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newRole}
                  onValueChange={(v) => setNewRole(v as "admin" | "super_admin")}
                  disabled={addingUser}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={addingUser || !selectedUserId}>
                {addingUser ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add User
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Administrators List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Administrators</CardTitle>
            <CardDescription>
              Users with admin or super admin access
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No administrators found
            </p>
          ) : (
            <div className="space-y-4">
              {admins.map((profile) => {
                const RoleIcon = roleIcons[profile.role];
                const isCurrentUser = profile.user_id === currentUserId;
                const isLoading = actionLoading === String(profile.id);

                return (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <RoleIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {profile.email || profile.user_id}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {roleLabels[profile.role]}
                        </p>
                      </div>
                    </div>
                    {!isCurrentUser && (
                      <div className="flex items-center gap-2">
                        {profile.role === "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateRole(
                                profile.id,
                                profile.user_id,
                                "super_admin"
                              )
                            }
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Promote"
                            )}
                          </Button>
                        )}
                        {profile.role === "super_admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateRole(profile.id, profile.user_id, "admin")
                            }
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Demote"
                            )}
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            removeUser(profile.id, profile.user_id)
                          }
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regular Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Regular Users</CardTitle>
          <CardDescription>
            Users without admin access - promote them to grant admin privileges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No regular users found
            </p>
          ) : (
            <div className="space-y-4">
              {users.map((profile) => {
                const isLoading = actionLoading === String(profile.id);

                return (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {profile.email || profile.user_id}
                        </p>
                        <p className="text-sm text-muted-foreground">User</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateRole(profile.id, profile.user_id, "admin")
                        }
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Make Admin"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateRole(profile.id, profile.user_id, "super_admin")
                        }
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Make Super Admin"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
