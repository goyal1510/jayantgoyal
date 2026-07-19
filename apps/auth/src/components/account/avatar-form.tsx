"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import {
  removeAvatarAction,
  uploadAvatarAction,
} from "@/app/actions/account";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import type { AuthActionState } from "@/lib/auth/action-support";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";

const initialState: AuthActionState = {};

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U"
  );
}

export function AvatarForm({
  displayName,
  currentAvatarUrl,
  hasUploadedAvatar,
}: {
  displayName: string;
  currentAvatarUrl: string | null;
  hasUploadedAvatar: boolean;
}) {
  const router = useRouter();
  const [uploadState, uploadAction] = useActionState(
    uploadAvatarAction,
    initialState,
  );
  const [removeState, removeAction] = useActionState(
    removeAvatarAction,
    initialState,
  );

  useEffect(() => {
    if (uploadState.success || removeState.success) router.refresh();
  }, [removeState.success, router, uploadState.success]);

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <Avatar className="size-20 rounded-2xl">
        {currentAvatarUrl ? (
          <AvatarImage src={currentAvatarUrl} alt={`${displayName} avatar`} />
        ) : null}
        <AvatarFallback className="rounded-2xl text-xl font-semibold">
          {initials(displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <Label htmlFor="avatar-file">Profile avatar</Label>
          <p className="text-muted-foreground mt-1 text-sm">
            Use a JPG, PNG, or WebP image up to 5 MB. An uploaded avatar takes
            priority over provider avatars.
          </p>
        </div>
        <form action={uploadAction} className="flex flex-wrap items-end gap-2">
          <Input
            id="avatar-file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="max-w-sm"
          />
          <SubmitButton
            idleLabel="Upload avatar"
            pendingLabel="Uploading…"
            variant="outline"
          />
        </form>
        <ActionMessage state={uploadState} />
        {hasUploadedAvatar ? (
          <form action={removeAction}>
            <Button type="submit" variant="ghost" className="px-0">
              Remove uploaded avatar
            </Button>
            <ActionMessage state={removeState} />
          </form>
        ) : null}
      </div>
    </div>
  );
}
