"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AppConfig } from "@/lib/hub-config"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

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
  label = "Apps",
}: NavAppsProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isOnPortfolio = pathname === "/" || pathname === ""

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {apps.map((app) => {
          const isActiveApp = activeAppId === app.id
          const hasSubNav = app.navItems.length > 0

          if (!hasSubNav) {
            // Single page app - no sub-navigation
            return (
              <SidebarMenuItem key={app.id}>
                <SidebarMenuButton
                  tooltip={app.name}
                  isActive={isActiveApp}
                >
                  <app.icon className={cn(app.color)} />
                  <span>{app.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // App with sub-navigation
          return (
            <Collapsible
              key={app.id}
              asChild
              defaultOpen={isActiveApp}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={app.name} isActive={isActiveApp}>
                    <app.icon className={cn(app.color)} />
                    <span>{app.name}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {app.navItems.map((navItem) => {
                      const isActiveNav = isActiveApp && activeNavId === navItem.id

                      // Portfolio uses hash navigation (scroll-based)
                      if (app.id === "portfolio") {
                        return (
                          <SidebarMenuSubItem key={navItem.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActiveNav}
                            >
                              <a
                                href={`/#${navItem.id}`}
                                onClick={(e) => {
                                  e.preventDefault()
                                  if (isOnPortfolio) {
                                    // Already on portfolio, just scroll
                                    const el = document.getElementById(navItem.id)
                                    if (el) {
                                      el.scrollIntoView({ behavior: "smooth" })
                                    }
                                  } else {
                                    // Navigate to portfolio with hash
                                    router.push(`/#${navItem.id}`)
                                  }
                                }}
                              >
                                <navItem.icon className={cn("size-4", navItem.color)} />
                                <span>{navItem.label}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      }

                      // Other apps use URL-based navigation
                      const href = navItem.url ?? `/${app.id}/${navItem.id}`
                      return (
                        <SidebarMenuSubItem key={navItem.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActiveNav}
                          >
                            <Link href={href}>
                              <navItem.icon className={cn("size-4", navItem.color)} />
                              <span>{navItem.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
