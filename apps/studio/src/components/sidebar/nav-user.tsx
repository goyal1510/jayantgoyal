"use client";

import { SidebarUserMenu } from "@repo/ui/sidebar-user-menu";
import {
  buildAuthAccountSecurityUrl,
  buildAuthLogoutUrl,
  resolveAuthFlowOwner,
} from "@repo/auth/entry";
import { signOutSession } from "@repo/auth/logout";

import { AccountSettingsSheet } from "@/components/sidebar/account-settings-sheet";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
  };
}) {
  const authOwnsNavigation = resolveAuthFlowOwner() === "auth";

  return (
    <SidebarUserMenu
      user={user}
      onSettings={
        authOwnsNavigation
          ? () => {
              window.location.href = buildAuthAccountSecurityUrl({
                requestUrl: window.location.href,
              }).toString();
            }
          : undefined
      }
      onSignOut={async () => {
        if (authOwnsNavigation) {
          window.location.href = buildAuthLogoutUrl({
            requestUrl: window.location.href,
          }).toString();
          return;
        }
        try {
          const supabase = createSupabaseBrowserClient();
          const { error } = await signOutSession(supabase);
          if (error) {
            toast.error(error.message);
            return;
          }
          window.location.href = `${window.location.pathname}?signed_out=true`;
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Unable to sign out.",
          );
        }
      }}
      renderSettings={
        authOwnsNavigation
          ? undefined
          : ({ open, close, displayName, setDisplayName }) => (
              <AccountSettingsSheet
                userName={displayName}
                onNameChange={setDisplayName}
                onClose={close}
                isOpen={open}
              />
            )
      }
    />
  );
}
