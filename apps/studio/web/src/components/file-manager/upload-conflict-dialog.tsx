"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@jayantgoyal/web-ui/dialog";
import { Button } from "@jayantgoyal/web-ui/button";
import { AlertCircle, Replace, SkipForward, Copy } from "lucide-react";
import { formatFileSize } from "@/lib/file-manager/format-utils";

export interface UploadConflictInfo {
  file: File;
  existingFile: {
    id: string;
    name: string;
    size: number;
    updated_at: string;
  };
}

export type UploadConflictResolution = "replace" | "keep" | "both";

interface UploadConflictDialogProps {
  conflict: UploadConflictInfo | null;
  onResolve: (resolution: UploadConflictResolution | null) => void;
}

export function UploadConflictDialog({
  conflict,
  onResolve,
}: UploadConflictDialogProps) {
  if (!conflict) return null;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={!!conflict} onOpenChange={() => onResolve(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            File Already Exists
          </DialogTitle>
          <DialogDescription>
            A file named{" "}
            <span className="font-medium">{conflict.file.name}</span> already
            exists in this directory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-md border p-3 space-y-1">
            <p className="text-sm font-medium">Existing file:</p>
            <p className="text-xs text-muted-foreground">
              Size: {formatFileSize(conflict.existingFile.size)} • Modified:{" "}
              {formatDate(conflict.existingFile.updated_at)}
            </p>
          </div>
          <div className="rounded-md border p-3 space-y-1">
            <p className="text-sm font-medium">New file:</p>
            <p className="text-xs text-muted-foreground">
              Size: {formatFileSize(conflict.file.size)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            className="w-full justify-start gap-2"
            onClick={() => onResolve("replace")}
          >
            <Replace className="h-4 w-4" />
            Keep Latest (Replace existing)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => onResolve("keep")}
          >
            <SkipForward className="h-4 w-4" />
            Keep Previous (Skip upload)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => onResolve("both")}
          >
            <Copy className="h-4 w-4" />
            Keep Both (Rename new file)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
