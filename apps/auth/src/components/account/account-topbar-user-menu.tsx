"use client";

import { useRouter } from "next/navigation";

import { ApplicationUserMenu } from "@repo/ui/application-user-menu";

export function AccountTopbarUserMenu({
  user,
  inSidebar = false,
}: {
  user: { name: string; email: string };
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
