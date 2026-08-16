"use client";

import { usePathname, useSearchParams } from "next/navigation";

import {
  BreadcrumbTrail,
  type BreadcrumbTrailItem,
} from "@jayant/web-ui/application-shell";

import { getAppById, HUB_APPS } from "@/lib/config/hub-config";
import { getStudioProduct } from "@/lib/config/studio-inventory";
import {
  getStudioSurface,
  type StudioSurfaceId,
} from "@/lib/config/studio-surfaces";
import { getToolByPath, toolCategories } from "@/lib/tools/tools";

function getSurfaceBreadcrumb(id: StudioSurfaceId) {
  const surface = getStudioSurface(id);
  return { appName: surface.name, appHref: surface.href, pageName: null };
}

function withSearchParams(
  pathname: string,
  searchParams: URLSearchParams,
  keys: string[],
) {
  const params = new URLSearchParams();

  for (const key of keys) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { appName, appHref, pageName } = (() => {
    if (pathname.startsWith("/products")) {
      const surface = getStudioSurface("studio-products");
      const slug = pathname.split("/").filter(Boolean)[1];

      return {
        appName: surface.name,
        appHref: withSearchParams(surface.href, searchParams, ["type"]),
        pageName: slug ? (getStudioProduct(slug)?.name ?? "Product") : null,
      };
    }

    if (pathname.startsWith("/games")) {
      const surface = getStudioSurface("game-hub");
      const gameApp = getAppById("game-hub");
      const segments = pathname.split("/").filter(Boolean);

      if (segments.length > 1 && segments[1]) {
        const navItem = gameApp?.navItems.find((item) => item.url === pathname);
        return {
          appName: surface.name,
          appHref: surface.href,
          pageName:
            navItem?.label ??
            segments[1]
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" "),
        };
      }

      return getSurfaceBreadcrumb("game-hub");
    }

    if (pathname.startsWith("/tools")) {
      const surface = getStudioSurface("tech-tools");
      const tool = getToolByPath(pathname);

      if (tool) {
        const category = toolCategories.find((candidate) =>
          candidate.tools.some((candidateTool) => candidateTool.id === tool.id),
        );

        return {
          appName: surface.name,
          appHref: withSearchParams(surface.href, searchParams, [
            "category",
            "q",
          ]),
          pageName: category ? `${category.title} / ${tool.title}` : tool.title,
        };
      }

      return getSurfaceBreadcrumb("tech-tools");
    }

    if (pathname === "/scratchpad" || pathname.startsWith("/scratchpad/")) {
      return getSurfaceBreadcrumb("scratchpad");
    }

    if (pathname.startsWith("/calculator")) {
      const surface = getStudioSurface("currency-calculator");
      const pageName =
        pathname === "/calculator/new"
          ? "New"
          : pathname === "/calculator/history"
            ? "History"
            : null;
      return { appName: surface.name, appHref: surface.href, pageName };
    }

    if (pathname.startsWith("/activity-tracker")) {
      const surface = getStudioSurface("activity-tracker");
      let pageName: string | null = null;

      if (pathname.includes("/dashboard")) pageName = "Dashboard";
      else if (pathname.includes("/tracker")) pageName = "Tracker";
      else if (pathname.includes("/management")) pageName = "Management";

      return { appName: surface.name, appHref: surface.href, pageName };
    }

    if (pathname === "/files" || pathname.startsWith("/files/")) {
      return getSurfaceBreadcrumb("file-manager");
    }

    if (pathname === "/weather") {
      return getSurfaceBreadcrumb("weather");
    }

    if (pathname === "/github-stats") {
      return getSurfaceBreadcrumb("github-stats");
    }

    if (pathname === "/custom-calculator") {
      return getSurfaceBreadcrumb("custom-calculator");
    }

    if (pathname === "/" || pathname === "") {
      return getSurfaceBreadcrumb("studio-home");
    }

    for (const app of HUB_APPS) {
      for (const navItem of app.navItems) {
        if (navItem.url && pathname === navItem.url) {
          return {
            appName: app.name,
            appHref: app.url ?? app.navItems[0]?.url ?? "/",
            pageName: navItem.label,
          };
        }
      }
    }

    return getSurfaceBreadcrumb("studio-home");
  })();

  const items: BreadcrumbTrailItem[] = pageName
    ? [
        { id: "application", label: appName, href: appHref },
        { id: "page", label: pageName },
      ]
    : [{ id: "application", label: appName }];

  return <BreadcrumbTrail homeHref="/" items={items} />;
}
