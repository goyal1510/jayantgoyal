"use client"

import { usePathname } from "next/navigation"
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
import { portfolioNavItems, blogNavItems, commerceNavItems, adminNavItems, deploymentNavItems } from "@/lib/config/nav-config"

export function DynamicBreadcrumb() {
  const pathname = usePathname()

  const { groupName, groupHref, pageName } = (() => {
    // Portfolio routes
    if (pathname.startsWith("/portfolio")) {
      const navItem = portfolioNavItems.find((item) => item.href === pathname)
      return {
        groupName: "Portfolio",
        groupHref: "/portfolio/hero",
        pageName: navItem?.label ?? null,
      }
    }

    // Blog routes
    if (pathname.startsWith("/blog")) {
      const navItem = blogNavItems.find((item) => item.href === pathname)
      return {
        groupName: "Blog",
        groupHref: "/blog",
        pageName: navItem?.label ?? null,
      }
    }

    // Commerce routes
    if (pathname.startsWith("/commerce")) {
      const navItem = commerceNavItems.find((item) => item.href === pathname)
      return {
        groupName: "Commerce",
        groupHref: "/commerce/analytics",
        pageName: navItem?.label ?? null,
      }
    }

    // Deployment routes
    if (pathname.startsWith("/deployments")) {
      const navItem = deploymentNavItems.find((item) => item.href === pathname)
      if (pathname.match(/^\/deployments\/[^/]+$/) && pathname !== "/deployments/env") {
        return {
          groupName: "Deployments",
          groupHref: "/deployments",
          pageName: "Deployment Detail",
        }
      }
      return {
        groupName: "Deployments",
        groupHref: "/deployments",
        pageName: navItem?.label ?? null,
      }
    }

    // Administration routes
    if (pathname === "/users" || pathname.startsWith("/users/")) {
      const navItem = adminNavItems.find((item) => item.href === pathname)
      return {
        groupName: "Administration",
        groupHref: "/users",
        pageName: navItem?.label ?? null,
      }
    }

    return { groupName: null, groupHref: null, pageName: null }
  })()

  return (
    <Breadcrumb className="min-w-0 flex-1 max-w-full">
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link href="/portfolio/hero" aria-label="Home">
              <Home className="size-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {groupName && (
          <>
            <BreadcrumbSeparator className="shrink-0" />
            <BreadcrumbItem className="shrink-0 max-w-[200px]">
              {pageName ? (
                <BreadcrumbLink asChild>
                  <Link href={groupHref!} className="truncate block">{groupName}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="truncate block">{groupName}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}
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
