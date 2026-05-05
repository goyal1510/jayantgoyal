"use client"

import { Fragment } from "react"
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
import { portfolioNavItems, blogNavItems, adminNavItems, deploymentNavItems, jobsNavItems } from "@/lib/config/nav-config"
import { useBreadcrumbContext } from "@/components/providers/breadcrumb-context"

type Crumb = { label: string; href: string }

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const { label: dynamicLabel } = useBreadcrumbContext()

  const { groupName, groupHref, trail } = (() => {
    // Jobs routes
    if (pathname.startsWith("/jobs")) {
      const trail: Crumb[] = []
      const navItem = jobsNavItems.find((item) => pathname.startsWith(item.href))
      if (navItem) {
        trail.push({ label: navItem.label, href: navItem.href })
      }
      // detail page: /jobs/listings/[id]
      if (/^\/jobs\/listings\/[^/]+$/.test(pathname)) {
        trail.push({ label: dynamicLabel ?? "Job Detail", href: pathname })
      }
      return { groupName: "Jobs", groupHref: "/jobs/listings", trail }
    }

    // Portfolio routes
    if (pathname.startsWith("/portfolio")) {
      const navItem = portfolioNavItems.find((item) => item.href === pathname)
      return {
        groupName: "Portfolio",
        groupHref: "/portfolio/hero",
        trail: navItem ? [{ label: navItem.label, href: navItem.href }] : [],
      }
    }

    // Blog routes
    if (pathname.startsWith("/blog")) {
      const navItem = blogNavItems.find((item) => item.href === pathname)
      return {
        groupName: "Blog",
        groupHref: "/blog",
        trail: navItem ? [{ label: navItem.label, href: navItem.href }] : [],
      }
    }

    // Deployment routes
    if (pathname.startsWith("/deployments")) {
      const navItem = deploymentNavItems.find((item) => item.href === pathname)
      if (pathname.match(/^\/deployments\/[^/]+$/) && pathname !== "/deployments/env") {
        return {
          groupName: "Deployments",
          groupHref: "/deployments",
          trail: [{ label: "Deployment Detail", href: pathname }],
        }
      }
      return {
        groupName: "Deployments",
        groupHref: "/deployments",
        trail: navItem ? [{ label: navItem.label, href: navItem.href }] : [],
      }
    }

    // Administration routes
    if (pathname === "/users" || pathname.startsWith("/users/")) {
      const navItem = adminNavItems.find((item) => item.href === pathname)
      return {
        groupName: "Administration",
        groupHref: "/users",
        trail: navItem ? [{ label: navItem.label, href: navItem.href }] : [],
      }
    }

    return { groupName: null, groupHref: null, trail: [] as Crumb[] }
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
            <BreadcrumbItem className="shrink-0 max-w-[160px]">
              {trail.length > 0 ? (
                <BreadcrumbLink asChild>
                  <Link href={groupHref!} className="truncate block">{groupName}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="truncate block">{groupName}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}
        {trail.map((crumb, idx) => {
          const isLast = idx === trail.length - 1
          return (
            <Fragment key={`${idx}-${crumb.href}`}>
              <BreadcrumbSeparator className="shrink-0" />
              <BreadcrumbItem className={isLast ? "min-w-0 flex-1" : "shrink-0 max-w-[160px]"}>
                {isLast ? (
                  <BreadcrumbPage className="block truncate">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href} className="truncate block">{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
