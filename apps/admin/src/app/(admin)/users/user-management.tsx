"use client";

import { useState, useEffect, useCallback } from "react";

import { toast } from "sonner";
import {
  Check,
  X,
  Trash2,
  Plus,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Label } from "@repo/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
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

const roleBadgeVariant: Record<UserRole, "secondary" | "default" | "destructive"> = {
  user: "secondary",
  admin: "default",
  super_admin: "destructive",
};

export function UserManagement({ currentUserId }: UserManagementProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add user dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("user");
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
        .schema("jg_account")
        .from("profiles")
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
        .schema("jg_account")
        .from("profiles")
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
              Manage all users and their roles
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setSelectedUserId("");
                setNewRole("user");
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={availableUsers.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAddUser}>
                  <DialogHeader>
                    <DialogTitle>Add User</DialogTitle>
                    <DialogDescription>
                      Add an existing user and assign a role. The user must have already signed up.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
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
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={newRole}
                        onValueChange={(v) => setNewRole(v as UserRole)}
                        disabled={addingUser}
                      >
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={addingUser || !selectedUserId}>
                      {addingUser ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Add User
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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
                                  updateRole(profile.id, profile.user_id, v as UserRole)
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
                              <Button
                                variant="destructive"
                                size="icon-sm"
                                onClick={() =>
                                  removeUser(profile.id, profile.user_id)
                                }
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
