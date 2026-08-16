"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@jayant/web-ui/lib/utils"
import type { AppConfig } from "@/lib/config/hub-config"
import { toolCategories } from "@/lib/tools/tools"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@jayant/web-ui/sidebar"

import { TechToolsMenuItem } from "./tech-tools-menu-item"
import { SubNavMenuItem } from "./sub-nav-menu-item"

interface NavAppsProps {
  apps: AppConfig[]
  activeAppId?: string
  activeNavId?: string
  label?: string
}

export function NavApps({
  apps,
  activeAppId,
  activeNavId,
  label,
}: NavAppsProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile, setOpenMobile, state } = useSidebar()

  const isCollapsed = state === "collapsed" && !isMobile

  // Close mobile sidebar on navigation
  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  // Determine active tool category for tech tools
  const activeCategoryId = toolCategories.find((category) =>
    category.tools.some((tool) => tool.path === pathname)
  )?.id

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {apps.map((app) => {
          const isActiveApp = activeAppId === app.id
          const hasSubNav = app.navItems.length > 0

          // Tech Tools - special nested navigation (categories > tools)
          if (app.id === "tech-tools") {
            return (
              <TechToolsMenuItem
                key={app.id}
                app={app}
                isActiveApp={isActiveApp}
                isCollapsed={isCollapsed}
                pathname={pathname}
                activeCategoryId={activeCategoryId}
                closeMobileSidebar={closeMobileSidebar}
              />
            )
          }

          // External link app - opens in new tab
          if (app.externalUrl) {
            return (
              <SidebarMenuItem key={app.id}>
                <SidebarMenuButton
                  asChild
                  tooltip={app.name}
                  isActive={isActiveApp}
                >
                  <a
                    href={app.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMobileSidebar}
                  >
                    <app.icon className={cn(app.color)} />
                    <span>{app.name}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // Single page app - no sub-navigation
          if (!hasSubNav) {
            const href = app.url ?? `/${app.id}`
            return (
              <SidebarMenuItem key={app.id}>
                <SidebarMenuButton
                  asChild
                  tooltip={app.name}
                  isActive={isActiveApp}
                >
                  <Link href={href} prefetch={false} onClick={closeMobileSidebar}>
                    <app.icon className={cn(app.color)} />
                    <span>{app.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // App with sub-navigation
          return (
            <SubNavMenuItem
              key={app.id}
              app={app}
              isActiveApp={isActiveApp}
              activeNavId={activeNavId}
              isCollapsed={isCollapsed}
              router={router}
              closeMobileSidebar={closeMobileSidebar}
            />
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
