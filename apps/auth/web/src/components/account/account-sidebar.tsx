"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  KeyRound,
  LayoutDashboard,
  Link2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { APP_BRANDS } from "@jayantgoyal/web-brand";
import { AccountTopbarUserMenu } from "@/components/account/account-topbar-user-menu";
import {
  ApplicationSidebarFrame,
  ApplicationSidebarSection,
  type ApplicationNavigationSection,
} from "@jayantgoyal/web-ui/application-shell";

const authBrand = {
  name: APP_BRANDS.auth.name,
  href: "/account/security",
  icon: ShieldCheck,
};

interface AccountSidebarProps
  extends Omit<
    React.ComponentProps<typeof ApplicationSidebarFrame>,
    "brand" | "children" | "footer"
  > {
  user: { name: string; email: string; avatarUrl?: string | null };
}

export function AccountSidebar({
  user,
  className,
  ...props
}: AccountSidebarProps) {
  const pathname = usePathname();
  const section: ApplicationNavigationSection = {
    id: "account",
    label: "Account",
    items: [
      {
        id: "overview",
        label: "Overview",
        href: "/account/security",
        icon: LayoutDashboard,
        isActive: pathname === "/account/security" || pathname === "/account",
      },
      {
        id: "profile",
        label: "Profile",
        href: "/account/profile",
        icon: UserRound,
        isActive: pathname.startsWith("/account/profile"),
      },
      {
        id: "password",
        label: "Password",
        href: "/account/password",
        icon: KeyRound,
        isActive: pathname.startsWith("/account/password"),
      },
      {
        id: "mfa",
        label: "MFA",
        href: "/account/mfa",
        icon: ShieldCheck,
        isActive: pathname.startsWith("/account/mfa"),
      },
      {
        id: "providers",
        label: "Providers",
        href: "/account/providers",
        icon: Link2,
        isActive: pathname.startsWith("/account/providers"),
      },
    ],
  };
  return (
    <ApplicationSidebarFrame
      brand={authBrand}
      className={className}
      footerClassName="border-t border-sidebar-border/80"
      footerSeparator={false}
      footer={<AccountTopbarUserMenu user={user} inSidebar />}
      {...props}
    >
      <ApplicationSidebarSection section={section} />
    </ApplicationSidebarFrame>
  );
}
