"use client";

import { SidebarUserMenu } from "@repo/ui/sidebar-user-menu";

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
  return (
    <SidebarUserMenu
      user={user}
      onSignOut={async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase.auth.signOut();
          if (error) {
            toast.error(error.message);
            return;
          }
          window.location.href = "/welcome";
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Unable to sign out.",
          );
        }
      }}
      renderSettings={({ open, close, displayName, setDisplayName }) => (
        <AccountSettingsSheet
          userName={displayName}
          onNameChange={setDisplayName}
          onClose={close}
          isOpen={open}
        />
      )}
    />
  );
}
