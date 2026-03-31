"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Home } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/breadcrumb"
import { getAppById, HUB_APPS } from "@/lib/config/hub-config"
import { toolCategories, getToolByPath } from "@/lib/tools/tools"

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const router = useRouter()

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

    // Messenger routes
    if (pathname === "/messenger" || pathname.startsWith("/messenger/")) {
      return { appName: "Sync Messenger", appHref: "/messenger", pageName: null }
    }

    // Currency Calculator routes
    if (pathname.startsWith("/calculator")) {
      const pageName = pathname === "/calculator/new" ? "New" : pathname === "/calculator/history" ? "History" : null
      return { appName: "Currency Calculator", appHref: "/calculator/new", pageName }
    }

    // Activity Tracker routes
    if (pathname.startsWith("/activity-tracker")) {
      let pageName: string | null = null
      if (pathname.includes("/dashboard")) pageName = "Dashboard"
      else if (pathname.includes("/tracker")) pageName = "Tracker"
      else if (pathname.includes("/management")) pageName = "Management"
      return { appName: "Activity Tracker", appHref: "/activity-tracker/dashboard", pageName }
    }

    // File Manager routes
    if (pathname === "/files" || pathname.startsWith("/files/")) {
      return { appName: "File Manager", appHref: "/files", pageName: null }
    }

    // Weather route
    if (pathname === "/weather") {
      return { appName: "Weather", appHref: "/weather", pageName: null }
    }

    // GitHub Stats route
    if (pathname === "/github-stats") {
      return { appName: "GitHub Stats", appHref: "/github-stats", pageName: null }
    }

    // Custom Calculator route
    if (pathname === "/custom-calculator") {
      return { appName: "Custom Calculator", appHref: "/custom-calculator", pageName: null }
    }

    // Portfolio - just show "Portfolio" without section tracking
    if (pathname === "/" || pathname === "") {
      return { appName: "Portfolio", appHref: "/", pageName: null }
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

    return { appName: "Portfolio", appHref: "/", pageName: null }
  })()

  return (
    <Breadcrumb className="min-w-0 flex-1 max-w-full">
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <button
              onClick={() => {
                router.push("/#home")
              }}
              aria-label="Home"
              className="flex items-center justify-center"
            >
              <Home className="size-4" />
            </button>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="shrink-0" />
        <BreadcrumbItem className="shrink-0 max-w-[200px]">
          {pageName ? (
            <BreadcrumbLink asChild>
              <Link href={appHref} className="truncate block">{appName}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="truncate block">{appName}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {pageName && (
          <>
            <BreadcrumbSeparator className="shrink-0" />
            <BreadcrumbItem className="min-w-0 flex-1">
              <BreadcrumbPage className="block truncate">
                {pageName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
