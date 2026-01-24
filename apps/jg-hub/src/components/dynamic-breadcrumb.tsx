"use client"

import * as React from "react"
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
import { getAppById, HUB_APPS } from "@/lib/hub-config"

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const [activeSection, setActiveSection] = React.useState("Home")

  // Determine app and page based on pathname
  const { appName, appHref, pageName } = React.useMemo(() => {
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

    // Portfolio (root)
    if (pathname === "/" || pathname === "") {
      return { appName: "Portfolio", appHref: "/", pageName: activeSection }
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

    return { appName: "Portfolio", appHref: "/", pageName: "Home" }
  }, [pathname, activeSection])

  // Portfolio section scroll tracking
  const portfolioSections = React.useMemo(() => {
    const portfolio = getAppById("portfolio")
    return portfolio?.navItems.map((item) => item.id) ?? []
  }, [])

  React.useEffect(() => {
    if (pathname !== "/" && pathname !== "") return
    if (!portfolioSections.length) return

    const sectionLabels: Record<string, string> = {
      home: "Home",
      about: "About",
      skills: "Skills",
      experience: "Experience",
      projects: "Projects",
      certificates: "Certificates",
      contact: "Contact",
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]?.target.id) {
          setActiveSection(sectionLabels[visible[0].target.id] ?? "Home")
        }
      },
      {
        rootMargin: "-30% 0px -40% 0px",
        threshold: [0.15, 0.3, 0.5],
      }
    )

    portfolioSections.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [pathname, portfolioSections])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={appHref}>{appName}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{pageName}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
