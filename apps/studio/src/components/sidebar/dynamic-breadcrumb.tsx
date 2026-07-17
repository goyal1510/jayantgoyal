"use client";

import { usePathname } from "next/navigation";

import {
  BreadcrumbTrail,
  type BreadcrumbTrailItem,
} from "@repo/ui/application-shell";
import { getAppById, HUB_APPS } from "@/lib/config/hub-config";
import { getStudioProduct } from "@/lib/config/studio-inventory";
import { toolCategories, getToolByPath } from "@/lib/tools/tools";

export function DynamicBreadcrumb() {
  const pathname = usePathname();

  // Determine app and page based on pathname
  const { appName, appHref, pageName } = (() => {
    if (pathname.startsWith("/products")) {
      const slug = pathname.split("/").filter(Boolean)[1];
      return {
        appName: "Products",
        appHref: "/products",
        pageName: slug ? (getStudioProduct(slug)?.name ?? "Product") : null,
      };
    }

    // Games routes
    if (pathname.startsWith("/games")) {
      const gameApp = getAppById("game-hub");
      if (!gameApp) {
        return {
          appName: "Game Hub",
          appHref: "/games",
          pageName: "Dashboard",
        };
      }

      // Check for specific game
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length > 1 && segments[1]) {
        const gameSlug = segments[1];
        const navItem = gameApp.navItems.find((item) => item.url === pathname);
        return {
          appName: "Game Hub",
          appHref: "/games",
          pageName:
            navItem?.label ??
            gameSlug
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" "),
        };
      }

      return { appName: "Game Hub", appHref: "/games", pageName: "Dashboard" };
    }

    // Tech Tools routes
    if (pathname.startsWith("/tools")) {
      const tool = getToolByPath(pathname);
      if (tool) {
        // Find the category this tool belongs to
        const category = toolCategories.find((cat) =>
          cat.tools.some((t) => t.id === tool.id),
        );
        return {
          appName: "Tech Tools",
          appHref: "/tools",
          pageName: category ? `${category.title} / ${tool.title}` : tool.title,
        };
      }
      return { appName: "Tech Tools", appHref: "/tools", pageName: null };
    }

    // Messenger routes
    if (pathname === "/messenger" || pathname.startsWith("/messenger/")) {
      return {
        appName: "Sync Messenger",
        appHref: "/messenger",
        pageName: null,
      };
    }

    // Currency Calculator routes
    if (pathname.startsWith("/calculator")) {
      const pageName =
        pathname === "/calculator/new"
          ? "New"
          : pathname === "/calculator/history"
            ? "History"
            : null;
      return {
        appName: "Currency Calculator",
        appHref: "/calculator/new",
        pageName,
      };
    }

    // Activity Tracker routes
    if (pathname.startsWith("/activity-tracker")) {
      let pageName: string | null = null;
      if (pathname.includes("/dashboard")) pageName = "Dashboard";
      else if (pathname.includes("/tracker")) pageName = "Tracker";
      else if (pathname.includes("/management")) pageName = "Management";
      return {
        appName: "Activity Tracker",
        appHref: "/activity-tracker/dashboard",
        pageName,
      };
    }

    // File Manager routes
    if (pathname === "/files" || pathname.startsWith("/files/")) {
      return { appName: "File Manager", appHref: "/files", pageName: null };
    }

    // Weather route
    if (pathname === "/weather") {
      return { appName: "Weather", appHref: "/weather", pageName: null };
    }

    // GitHub Stats route
    if (pathname === "/github-stats") {
      return {
        appName: "GitHub Stats",
        appHref: "/github-stats",
        pageName: null,
      };
    }

    // Custom Calculator route
    if (pathname === "/custom-calculator") {
      return {
        appName: "Custom Calculator",
        appHref: "/custom-calculator",
        pageName: null,
      };
    }

    // Studio home
    if (pathname === "/" || pathname === "") {
      return {
        appName: "Studio",
        appHref: "/",
        pageName: null,
      };
    }

    // Check other apps
    for (const app of HUB_APPS) {
      for (const navItem of app.navItems) {
        if (navItem.url && pathname === navItem.url) {
          return {
            appName: app.name,
            appHref: app.navItems[0]?.url ?? "/",
            pageName: navItem.label,
          };
        }
      }
    }

    return { appName: "Studio", appHref: "/", pageName: null };
  })();

  const items: BreadcrumbTrailItem[] = pageName
    ? [
        { id: "application", label: appName, href: appHref },
        { id: "page", label: pageName },
      ]
    : [{ id: "application", label: appName }];

  return <BreadcrumbTrail homeHref="/" items={items} />;
}
