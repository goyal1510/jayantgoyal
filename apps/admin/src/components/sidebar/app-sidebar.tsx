"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";

import { APP_BRANDS } from "@repo/brand";
import {
  ApplicationSidebarFrame,
  ApplicationSidebarSection,
  type ApplicationNavigationItem,
  type ApplicationNavigationSection,
} from "@repo/ui/application-shell";

import { NavUser } from "@/components/sidebar/nav-user";
import {
  portfolioNavItems,
  blogNavItems,
  adminNavItems,
  deploymentNavItems,
} from "@/lib/config/nav-config";
import type { NavItem } from "@/lib/config/nav-config";
import type { AuthUser } from "@/lib/types";

const adminBrand = {
  name: APP_BRANDS.admin.name,
  href: "/portfolio/hero",
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
    isActive: pathname === item.href,
  });
  const sections: ApplicationNavigationSection[] = [
    {
      id: "portfolio",
      label: "Portfolio",
      items: portfolioNavItems.map(navigationItem),
    },
    {
      id: "blog",
      label: "Blog",
      items: blogNavItems.map(navigationItem),
    },
    ...(user.role === "super_admin"
      ? [
          {
            id: "deployments",
            label: "Deployments",
            items: deploymentNavItems.map(navigationItem),
          },
          {
            id: "administration",
            label: "Administration",
            items: adminNavItems.map(navigationItem),
          },
        ]
      : []),
  ];

  return (
    <ApplicationSidebarFrame
      brand={adminBrand}
      footer={<NavUser user={{ email: user.email, name: user.name }} />}
      {...props}
    >
      {sections.map((section) => (
        <ApplicationSidebarSection key={section.id} section={section} />
      ))}
    </ApplicationSidebarFrame>
  );
}
