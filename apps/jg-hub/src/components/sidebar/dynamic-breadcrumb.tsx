"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getAppById, HUB_APPS } from "@/lib/config/hub-config"
import { toolCategories, getToolByPath } from "@/lib/tools/tools"

export function DynamicBreadcrumb() {
  const pathname = usePathname()

  // Determine app and page based on pathname
  const { appName, appHref, pageName } = (() => {
    // Games routes
    if (pathname.startsWith("/games")) {
      const gameApp = getAppById("game-hub")
      if (!gameApp) {
        return { appName: "Game Hub", appHref: "/games", pageName: "Dashboard" }
      }

      // Check for specific game
      const segments = pathname.split("/").filter(Boolean)
      if (segments.length > 1 && segments[1]) {
        const gameSlug = segments[1]
        const navItem = gameApp.navItems.find((item) => item.url === pathname)
        return {
          appName: "Game Hub",
          appHref: "/games",
          pageName: navItem?.label ?? gameSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        }
      }

      return { appName: "Game Hub", appHref: "/games", pageName: "Dashboard" }
    }

    // Tech Tools routes
    if (pathname.startsWith("/tools")) {
      const tool = getToolByPath(pathname)
      if (tool) {
        // Find the category this tool belongs to
        const category = toolCategories.find((cat) =>
          cat.tools.some((t) => t.id === tool.id)
        )
        return {
          appName: "Tech Tools",
          appHref: "/tools",
          pageName: category ? `${category.title} / ${tool.title}` : tool.title,
        }
      }
      return { appName: "Tech Tools", appHref: "/tools", pageName: null }
    }

    // Portfolio - just show "Portfolio" without section tracking
    if (pathname === "/portfolio" || pathname === "/" || pathname === "") {
      return { appName: "Portfolio", appHref: "/portfolio", pageName: null }
    }

    // Check other apps
    for (const app of HUB_APPS) {
      for (const navItem of app.navItems) {
        if (navItem.url && pathname === navItem.url) {
          return {
            appName: app.name,
            appHref: app.navItems[0]?.url ?? "/",
            pageName: navItem.label,
          }
        }
      }
    }

    return { appName: "Portfolio", appHref: "/portfolio", pageName: null }
  })()

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {pageName ? (
            <BreadcrumbLink asChild>
              <Link href={appHref}>{appName}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{appName}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {pageName && (
          <>
            <BreadcrumbSeparator className="md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageName}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
