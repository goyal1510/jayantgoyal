import { useMemo } from "react"
import type { AppConfig } from "@/lib/config/hub-config"

/** Route-to-app mapping rules */
const ROUTE_MAP: { prefix: string; appId: string; navResolver?: (pathname: string) => string | undefined }[] = [
  { prefix: "/games", appId: "game-hub" },
  { prefix: "/tools", appId: "tech-tools" },
  { prefix: "/messenger", appId: "messenger" },
  {
    prefix: "/account",
    appId: "account",
    navResolver: (p) => (p.includes("/purchases") ? "purchases" : "billing"),
  },
  {
    prefix: "/calculator",
    appId: "currency-calculator",
    navResolver: (p) => (p === "/calculator/new" ? "new" : "history"),
  },
  {
    prefix: "/activity-tracker",
    appId: "activity-tracker",
    navResolver: (p) => {
      if (p.includes("/tracker")) return "tracker"
      if (p.includes("/management")) return "management"
      return "dashboard"
    },
  },
  { prefix: "/files", appId: "file-manager" },
  { prefix: "/weather", appId: "weather" },
  { prefix: "/github-stats", appId: "github-stats" },
  { prefix: "/custom-calculator", appId: "custom-calculator" },
  { prefix: "/pricing", appId: "commerce", navResolver: () => "pricing" },
  {
    prefix: "/store",
    appId: "commerce",
    navResolver: (p) => (p === "/store" ? "store" : "store"),
  },
  { prefix: "/blogs", appId: "blog" },
  { prefix: "/blog", appId: "blog" },
]

/**
 * Determines the active app and nav item based on the current pathname.
 */
export function useActiveApp(pathname: string, apps: AppConfig[]) {
  return useMemo(() => {
    // Check route map
    for (const route of ROUTE_MAP) {
      if (pathname === route.prefix || pathname.startsWith(route.prefix + "/") || pathname.startsWith(route.prefix)) {
        const navId = route.navResolver?.(pathname)

        // For game-hub, resolve nav from app config
        if (route.appId === "game-hub" && !navId) {
          const gameApp = apps.find((a) => a.id === "game-hub")
          const activeNav = gameApp?.navItems.find((n) => n.url === pathname)
          return { activeAppId: "game-hub", activeNavId: activeNav?.id ?? "dashboard" }
        }

        return { activeAppId: route.appId, activeNavId: navId }
      }
    }

    // Portfolio root
    if (pathname === "/" || pathname === "") {
      return { activeAppId: "portfolio", activeNavId: "home" }
    }

    // Check all app nav items as fallback
    for (const app of apps) {
      for (const navItem of app.navItems) {
        if (navItem.url && pathname === navItem.url) {
          return { activeAppId: app.id, activeNavId: navItem.id }
        }
      }
    }

    return { activeAppId: "portfolio", activeNavId: "home" }
  }, [pathname, apps])
}
