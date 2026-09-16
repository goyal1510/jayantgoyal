"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@jayantgoyal/web-ui/badge";
import { Button } from "@jayantgoyal/web-ui/button";
import { IconAction } from "@jayantgoyal/web-ui/icon-action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jayantgoyal/web-ui/select";

type OrbitRoleKey = "orbit.participant" | "orbit.creator";

interface OrbitProfile {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  orbit_role: OrbitRoleKey | null;
}

interface AvailableUser {
  id: string;
  email: string;
}

const roleLabels: Record<OrbitRoleKey, string> = {
  "orbit.participant": "Participant",
  "orbit.creator": "Creator",
};

type OrbitAccessPanelProps = {
  currentUserId: string;
  canManageAccess: boolean;
};

export function OrbitAccessPanel({
  currentUserId,
  canManageAccess,
}: OrbitAccessPanelProps) {
  const [profiles, setProfiles] = useState<OrbitProfile[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newRole, setNewRole] = useState<OrbitRoleKey>("orbit.participant");

  const fetchAccess = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/users/orbit-access");
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to fetch Orbit access");
        return;
      }
      setProfiles(data.profiles || []);
      setAvailableUsers(data.availableUsers || []);
    } catch {
      toast.error("Failed to fetch Orbit access");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  async function saveAccess(userId: string, role: OrbitRoleKey, method: "POST" | "PATCH") {
    if (userId === currentUserId) {
      toast.error("You cannot change your own Orbit access");
      return;
    }

    setActionLoading(userId);
    try {
      const response = await fetch("/api/users/orbit-access", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update Orbit access");
        return;
      }
      toast.success(data.message);
      fetchAccess();
    } catch {
      toast.error("Failed to update Orbit access");
    } finally {
      setActionLoading(null);
    }
  }

  async function removeAccess(userId: string) {
    setActionLoading(userId);
    try {
      const response = await fetch("/api/users/orbit-access", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to remove Orbit access");
        return;
      }
      toast.success(data.message);
      fetchAccess();
    } catch {
      toast.error("Failed to remove Orbit access");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Orbit access</CardTitle>
          <CardDescription>
            Grant product entry and creator/participant roles for private alpha.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAccess}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {canManageAccess ? (
          <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium" htmlFor="orbit-user">
                User
              </label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="orbit-user">
                  <SelectValue placeholder="Select a user" />
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
              <label className="text-sm font-medium" htmlFor="orbit-role">
                Role
              </label>
              <Select
                value={newRole}
                onValueChange={(value) => setNewRole(value as OrbitRoleKey)}
              >
                <SelectTrigger id="orbit-role" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orbit.participant">Participant</SelectItem>
                  <SelectItem value="orbit.creator">Creator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              disabled={!selectedUserId || actionLoading !== null}
              onClick={() => saveAccess(selectedUserId, newRole, "POST")}
            >
              Grant access
            </Button>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Orbit access…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Orbit role</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles
                  .filter((profile) => profile.orbit_role)
                  .map((profile) => {
                    const isLoading = actionLoading === profile.user_id;
                    return (
                      <tr key={profile.user_id} className="border-b last:border-0">
                        <td className="py-3 pr-4">{profile.email}</td>
                        <td className="py-3 pr-4">
                          {profile.orbit_role ? (
                            <Badge variant="secondary">
                              {roleLabels[profile.orbit_role]}
                            </Badge>
                          ) : null}
                        </td>
                        <td className="py-3 text-right">
                          {canManageAccess && profile.user_id !== currentUserId ? (
                            <div className="flex items-center justify-end gap-2">
                              <Select
                                value={profile.orbit_role ?? "orbit.participant"}
                                onValueChange={(value) =>
                                  saveAccess(
                                    profile.user_id,
                                    value as OrbitRoleKey,
                                    "PATCH",
                                  )
                                }
                              >
                                <SelectTrigger className="w-[160px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="orbit.participant">
                                    Participant
                                  </SelectItem>
                                  <SelectItem value="orbit.creator">
                                    Creator
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <IconAction
                                icon={isLoading ? Loader2 : Trash2}
                                iconClassName={
                                  isLoading ? "size-3.5 animate-spin" : "size-3.5"
                                }
                                label="Remove Orbit access"
                                variant="destructive"
                                disabled={isLoading}
                                onClick={() => removeAccess(profile.user_id)}
                              />
                            </div>
                          ) : null}
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
  );
}
