"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AppConfig } from "@/lib/config/hub-config"
import { toolCategories } from "@/lib/tools/tools"

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
  useSidebar,
} from "@/components/ui/sidebar"

// Color palette for tool icons
const TOOL_COLORS = [
  "text-red-500 dark:text-red-400",
  "text-orange-500 dark:text-orange-400",
  "text-amber-500 dark:text-amber-400",
  "text-yellow-500 dark:text-yellow-400",
  "text-lime-500 dark:text-lime-400",
  "text-green-500 dark:text-green-400",
  "text-emerald-500 dark:text-emerald-400",
  "text-teal-500 dark:text-teal-400",
  "text-cyan-500 dark:text-cyan-400",
  "text-sky-500 dark:text-sky-400",
  "text-blue-500 dark:text-blue-400",
  "text-indigo-500 dark:text-indigo-400",
  "text-violet-500 dark:text-violet-400",
  "text-purple-500 dark:text-purple-400",
  "text-fuchsia-500 dark:text-fuchsia-400",
  "text-pink-500 dark:text-pink-400",
  "text-rose-500 dark:text-rose-400",
]

// Get consistent color based on tool id
function getToolColor(toolId: string): string {
  let hash = 0
  for (let i = 0; i < toolId.length; i++) {
    hash = ((hash << 5) - hash) + toolId.charCodeAt(i)
    hash = hash & hash
  }
  return TOOL_COLORS[Math.abs(hash) % TOOL_COLORS.length]!
}

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
  const { isMobile, setOpenMobile } = useSidebar()
  const isOnPortfolio = pathname === "/portfolio" || pathname.startsWith("/portfolio#")

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
                      {toolCategories.map((category) => {
                        const isCategoryActive = activeCategoryId === category.id
                        return (
                          <Collapsible
                            key={category.id}
                            asChild
                            defaultOpen={isCategoryActive}
                            className="group/category"
                          >
                            <SidebarMenuSubItem>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuSubButton className="cursor-pointer" isActive={isCategoryActive}>
                                  <category.icon className={cn("size-4", category.color)} />
                                  <span>{category.title}</span>
                                  <ChevronRight className="ml-auto size-3 transition-transform duration-200 group-data-[state=open]/category:rotate-90" />
                                </SidebarMenuSubButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <SidebarMenuSub className="ml-2 border-l border-sidebar-border pl-2">
                                  {category.tools.map((tool) => {
                                    const isToolActive = pathname === tool.path
                                    return (
                                      <SidebarMenuSubItem key={tool.id}>
                                        <SidebarMenuSubButton
                                          asChild
                                          isActive={isToolActive}
                                        >
                                          <Link href={tool.path} onClick={closeMobileSidebar}>
                                            <tool.icon className={cn("size-4", getToolColor(tool.id))} />
                                            <span>{tool.title}</span>
                                          </Link>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    )
                                  })}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </SidebarMenuSubItem>
                          </Collapsible>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          // Single page app - no sub-navigation
          if (!hasSubNav) {
            const href = `/${app.id}`
            return (
              <SidebarMenuItem key={app.id}>
                <SidebarMenuButton
                  asChild
                  tooltip={app.name}
                  isActive={isActiveApp}
                >
                  <Link href={href} onClick={closeMobileSidebar}>
                    <app.icon className={cn(app.color)} />
                    <span>{app.name}</span>
                  </Link>
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
                                href={`/portfolio#${navItem.id}`}
                                onClick={(e) => {
                                  e.preventDefault()
                                  closeMobileSidebar()
                                  if (isOnPortfolio) {
                                    // Already on portfolio, just scroll
                                    const el = document.getElementById(navItem.id)
                                    if (el) {
                                      el.scrollIntoView({ behavior: "smooth" })
                                    }
                                  } else {
                                    // Navigate to portfolio with hash
                                    router.push(`/portfolio#${navItem.id}`)
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
                            <Link href={href} onClick={closeMobileSidebar}>
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
