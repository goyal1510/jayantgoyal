"use client";

import { useTransition } from "react";

import {
  buildAuthAccountSecurityUrl,
  buildAuthLogoutUrl,
} from "@repo/auth/entry";
import { ApplicationUserMenu } from "@repo/ui/application-user-menu";

export function TopbarUserMenu({
  user,
  inSidebar = false,
}: {
  user: { name: string; email: string };
  inSidebar?: boolean;
}) {
  const [isSigningOut, startSigningOut] = useTransition();

  function openSettings() {
    window.location.href = buildAuthAccountSecurityUrl({
      requestUrl: window.location.href,
    }).toString();
  }

  function signOut() {
    window.location.href = buildAuthLogoutUrl({
      requestUrl: window.location.href,
    }).toString();
  }

  return (
    <ApplicationUserMenu
      user={user}
      inSidebar={inSidebar}
      onSettings={openSettings}
      onSignOut={() => {
        startSigningOut(signOut);
      }}
      isSigningOut={isSigningOut}
    />
  );
}
