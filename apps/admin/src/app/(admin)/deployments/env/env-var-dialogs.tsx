"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import type { VercelEnvVar } from "@/lib/types";

const ENV_TARGETS = ["production", "preview", "development"] as const;

interface AddEnvVarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectLabel: string;
  newKey: string;
  setNewKey: (v: string) => void;
  newValue: string;
  setNewValue: (v: string) => void;
  newType: string;
  setNewType: (v: string) => void;
  newTargets: string[];
  toggleTarget: (t: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  adding: boolean;
}

export function AddEnvVarDialog({
  open,
  onOpenChange,
  projectLabel,
  newKey,
  setNewKey,
  newValue,
  setNewValue,
  newType,
  setNewType,
  newTargets,
  toggleTarget,
  onSubmit,
  adding,
}: AddEnvVarDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o);
      if (!o) {
        setNewKey("");
        setNewValue("");
        setNewType("encrypted");
      }
    }}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add Environment Variable</DialogTitle>
            <DialogDescription>
              Add a new environment variable to the {projectLabel} app.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="env-key">Key</Label>
              <Input
                id="env-key"
                placeholder="MY_ENV_VAR"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                disabled={adding}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="env-value">Value</Label>
              <Input
                id="env-value"
                placeholder="value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                disabled={adding}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="env-type">Type</Label>
              <Select value={newType} onValueChange={setNewType} disabled={adding}>
                <SelectTrigger id="env-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="encrypted">Encrypted</SelectItem>
                  <SelectItem value="plain">Plain</SelectItem>
                  <SelectItem value="sensitive">Sensitive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Targets</Label>
              <div className="flex gap-2">
                {ENV_TARGETS.map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={newTargets.includes(t) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTarget(t)}
                    disabled={adding}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={adding || !newKey || !newValue}>
              {adding && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Variable
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditEnvVarDialogProps {
  editVar: VercelEnvVar | null;
  onClose: () => void;
  editValue: string;
  setEditValue: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  editing: boolean;
}

export function EditEnvVarDialog({
  editVar,
  onClose,
  editValue,
  setEditValue,
  onSubmit,
  editing,
}: EditEnvVarDialogProps) {
  return (
    <Dialog
      open={!!editVar}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Environment Variable</DialogTitle>
            <DialogDescription>
              Update the value for <span className="font-mono">{editVar?.key}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-value">Value</Label>
              <Input
                id="edit-value"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                disabled={editing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={editing || !editValue}>
              {editing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
