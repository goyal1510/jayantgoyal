"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@jayant/web-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@jayant/web-ui/dialog";

interface ConfirmActionDialogProps {
  action: "redeploy" | "rollback" | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  deploymentLabel: string;
}

export function ConfirmActionDialog({
  action,
  onClose,
  onConfirm,
  loading,
  deploymentLabel,
}: ConfirmActionDialogProps) {
  return (
    <Dialog
      open={!!action}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === "redeploy" ? "Redeploy" : "Rollback"} Confirmation
          </DialogTitle>
          <DialogDescription>
            {action === "redeploy"
              ? `This will create a new deployment based on ${deploymentLabel}.`
              : `This will rollback production to ${deploymentLabel}.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={action === "rollback" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {action === "redeploy" ? "Redeploy" : "Rollback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
