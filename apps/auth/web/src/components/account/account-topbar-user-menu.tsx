"use client";

import { useRouter } from "next/navigation";

import { ApplicationUserMenu } from "@jayantgoyal/web-ui/application-user-menu";

export function AccountTopbarUserMenu({
  user,
  inSidebar = false,
}: {
  user: { name: string; email: string; avatarUrl?: string | null };
  inSidebar?: boolean;
}) {
  const router = useRouter();

  return (
    <ApplicationUserMenu
      user={user}
      inSidebar={inSidebar}
      onSettings={() => router.push("/account/security")}
      onSignOut={() => {
        window.location.href = "/logout";
      }}
    />
  );
}
