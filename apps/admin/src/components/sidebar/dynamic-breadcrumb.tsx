"use client";

import { usePathname } from "next/navigation";

import {
  BreadcrumbTrail,
  type BreadcrumbTrailItem,
} from "@repo/ui/application-shell";
import {
  portfolioNavItems,
  blogNavItems,
  adminNavItems,
  deploymentNavItems,
} from "@/lib/config/nav-config";

export function DynamicBreadcrumb() {
  const pathname = usePathname();

  const { groupName, groupHref, pageName } = (() => {
    // Portfolio routes
    if (pathname.startsWith("/portfolio")) {
      const navItem = portfolioNavItems.find((item) => item.href === pathname);
      return {
        groupName: "Portfolio",
        groupHref: "/portfolio/hero",
        pageName: navItem?.label ?? null,
      };
    }

    // Blog routes
    if (pathname.startsWith("/blog")) {
      const navItem = blogNavItems.find((item) => item.href === pathname);
      return {
        groupName: "Blog",
        groupHref: "/blog",
        pageName: navItem?.label ?? null,
      };
    }

    // Deployment routes
    if (pathname.startsWith("/deployments")) {
      const navItem = deploymentNavItems.find((item) => item.href === pathname);
      if (
        pathname.match(/^\/deployments\/[^/]+$/) &&
        pathname !== "/deployments/env"
      ) {
        return {
          groupName: "Deployments",
          groupHref: "/deployments",
          pageName: "Deployment Detail",
        };
      }
      return {
        groupName: "Deployments",
        groupHref: "/deployments",
        pageName: navItem?.label ?? null,
      };
    }

    // Administration routes
    if (pathname === "/users" || pathname.startsWith("/users/")) {
      const navItem = adminNavItems.find((item) => item.href === pathname);
      return {
        groupName: "Administration",
        groupHref: "/users",
        pageName: navItem?.label ?? null,
      };
    }

    return { groupName: null, groupHref: null, pageName: null };
  })();

  const items: BreadcrumbTrailItem[] = groupName
    ? [
        {
          id: "group",
          label: groupName,
          href: pageName ? (groupHref ?? undefined) : undefined,
        },
        ...(pageName ? [{ id: "page", label: pageName }] : []),
      ]
    : [];

  return <BreadcrumbTrail homeHref="/portfolio/hero" items={items} />;
}
