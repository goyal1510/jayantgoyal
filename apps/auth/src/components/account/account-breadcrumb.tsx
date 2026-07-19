"use client";

import { usePathname } from "next/navigation";

import {
  BreadcrumbTrail,
  type BreadcrumbTrailItem,
} from "@repo/ui/application-shell";

export function AccountBreadcrumb() {
  const pathname = usePathname();
  const pageLabel = pathname.startsWith("/account/profile")
    ? "Profile"
    : pathname.startsWith("/account/password")
      ? "Password"
      : pathname.startsWith("/account/mfa")
        ? "MFA"
        : pathname.startsWith("/account/providers")
          ? "Providers"
          : "Overview";
  const items: BreadcrumbTrailItem[] = [
    { id: "account", label: "Account", href: "/account/security" },
    { id: "page", label: pageLabel },
  ];

  return <BreadcrumbTrail homeHref="/account/security" items={items} />;
}
