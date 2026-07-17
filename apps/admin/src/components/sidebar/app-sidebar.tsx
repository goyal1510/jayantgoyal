"use client";

import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";

import { APP_BRANDS } from "@repo/brand";
import {
  AppSidebarShell,
  type AppSidebarNavGroupConfig,
  type AppSidebarNavItem,
} from "@repo/ui/app-sidebar-shell";

import { NavUser } from "@/components/sidebar/nav-user";
import {
  adminNavItems,
  blogNavItems,
  deploymentNavItems,
  portfolioNavItems,
  type NavItem,
} from "@/lib/config/nav-config";
import type { AuthUser } from "@/lib/types";

function configureItems(
  items: NavItem[],
  pathname: string,
): AppSidebarNavItem[] {
  return items.map((item) => ({
    id: item.href,
    label: item.label,
    href: item.href,
    icon: item.icon,
    isActive: pathname === item.href,
  }));
}

export function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const isSuperAdmin = user.role === "super_admin";
  const groups: AppSidebarNavGroupConfig[] = [
    {
      id: "portfolio",
      label: "Portfolio",
      items: configureItems(portfolioNavItems, pathname),
    },
    {
      id: "blog",
      label: "Blog",
      items: configureItems(blogNavItems, pathname),
    },
    {
      id: "deployments",
      label: "Deployments",
      items: configureItems(deploymentNavItems, pathname),
      visible: isSuperAdmin,
    },
    {
      id: "administration",
      label: "Administration",
      items: configureItems(adminNavItems, pathname),
      visible: isSuperAdmin,
    },
  ];

  return (
    <AppSidebarShell
      brand={{
        name: APP_BRANDS.admin.name,
        href: "/portfolio/hero",
        icon: Shield,
      }}
      groups={groups}
      footer={<NavUser user={{ email: user.email, name: user.name }} />}
    />
  );
}
