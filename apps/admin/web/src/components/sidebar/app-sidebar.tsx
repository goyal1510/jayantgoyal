"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";

import { APP_BRANDS } from "@jayant/web-brand";
import {
  ApplicationSidebarFrame,
  ApplicationSidebarSection,
  type ApplicationNavigationItem,
  type ApplicationNavigationSection,
} from "@jayant/web-ui/application-shell";

import {
  getVisibleAdminNavigationDomains,
  isAdminNavigationItemActive,
} from "@/lib/config/nav-config";
import type { NavItem } from "@/lib/config/nav-config";
import type { AuthUser } from "@/lib/types";
import { TopbarUserMenu } from "@/components/header/topbar-user-menu";

const adminBrand = {
  name: APP_BRANDS.admin.name,
  href: "/portfolio",
  icon: Shield,
};

interface AppSidebarProps
  extends Omit<
    React.ComponentProps<typeof ApplicationSidebarFrame>,
    "brand" | "children" | "footer"
  > {
  user: AuthUser;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const navigationItem = (item: NavItem): ApplicationNavigationItem => ({
    id: item.href,
    label: item.label,
    href: item.href,
    icon: item.icon,
    isActive: isAdminNavigationItemActive(pathname, item),
  });
  const sections: ApplicationNavigationSection[] =
    getVisibleAdminNavigationDomains(user.role).map((domain) => ({
      id: domain.id,
      label: domain.label,
      items: domain.items.map(navigationItem),
    }));

  return (
    <ApplicationSidebarFrame
      brand={adminBrand}
      footerClassName="border-t border-sidebar-border/80"
      footerSeparator={false}
      footer={<TopbarUserMenu user={user} inSidebar />}
      {...props}
    >
      {sections.map((section) => (
        <ApplicationSidebarSection key={section.id} section={section} />
      ))}
    </ApplicationSidebarFrame>
  );
}
