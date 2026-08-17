"use client";

import { Loader2, Plus } from "lucide-react";
import { Button } from "@jayantgoyal/web-ui/button";
import { Label } from "@jayantgoyal/web-ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@jayantgoyal/web-ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jayantgoyal/web-ui/select";
import type { AdminRoleKey } from "@/lib/types";
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
  newRole: AdminRoleKey;
  setNewRole: (role: AdminRoleKey) => void;
  onSubmit: (e: React.FormEvent) => void;
  adding: boolean;
  disabled: boolean;
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
  disabled,
}: AddUserDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setSelectedUserId("");
          setNewRole("admin.viewer");
        }
      }}
    >
      <DialogContent>
        <AccessibleForm onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Grant Admin access</DialogTitle>
            <DialogDescription>
              Activate Admin membership for an existing identity and assign an
              approved role.
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
                onValueChange={(v) => setNewRole(v as AdminRoleKey)}
                disabled={adding || disabled}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin.viewer">Viewer</SelectItem>
                  <SelectItem value="admin.full_access">Full access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={disabled || adding || !selectedUserId}
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Grant access
            </Button>
          </DialogFooter>
        </AccessibleForm>
      </DialogContent>
    </Dialog>
  );
}
