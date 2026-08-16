"use client";

import { Loader2, Plus } from "lucide-react";
import { Button } from "@jayant/web-ui/button";
import { Label } from "@jayant/web-ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@jayant/web-ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jayant/web-ui/select";
import type { UserRole } from "@/lib/types";
import { AccessibleForm } from "@/components/accessible-form";

interface AvailableUser {
  id: string;
  email: string;
  created_at: string;
}

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableUsers: AvailableUser[];
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  newRole: UserRole;
  setNewRole: (role: UserRole) => void;
  onSubmit: (e: React.FormEvent) => void;
  adding: boolean;
}

export function AddUserDialog({
  open,
  onOpenChange,
  availableUsers,
  selectedUserId,
  setSelectedUserId,
  newRole,
  setNewRole,
  onSubmit,
  adding,
}: AddUserDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setSelectedUserId("");
          setNewRole("user" as UserRole);
        }
      }}
    >
      <DialogContent>
        <AccessibleForm onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Add an existing user and assign a role. The user must have already
              signed up.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">Select User</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={adding}
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
                disabled={adding}
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
            <Button type="submit" disabled={adding || !selectedUserId}>
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add User
            </Button>
          </DialogFooter>
        </AccessibleForm>
      </DialogContent>
    </Dialog>
  );
}
