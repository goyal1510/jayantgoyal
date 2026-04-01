"use client"

import React from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import type { AppConfig, NavItem } from "@/lib/config/hub-config"
import { toolCategories } from "@/lib/tools/tools"
import type { ToolCategory } from "@/lib/tools/tools"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/collapsible"
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
} from "@repo/ui/sidebar"

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

// --- Click-based CollapsedFlyout component ---

function CollapsedFlyout({
  triggerRef,
  open,
  onClose,
  children,
  title,
}: {
  triggerRef: React.RefObject<HTMLLIElement | null>
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
}) {
  const flyoutRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  // Position flyout when opened
  React.useEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPosition({
      top: rect.top,
      left: rect.right + 4,
    })
  }, [open, triggerRef])

  // Close on click outside
  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        flyoutRef.current && !flyoutRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        onClose()
      }
    }

    // Close on Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    // Use setTimeout so the opening click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onClose, triggerRef])

  if (!open) return null

  // Clamp so flyout doesn't overflow off-screen
  const maxH = `min(400px, calc(100vh - ${position.top}px - 1rem))`

  return createPortal(
    <div
      ref={flyoutRef}
      className="animate-in fade-in-0 slide-in-from-left-2 fixed z-50 min-w-[180px] rounded-md border border-sidebar-border bg-sidebar p-1 shadow-lg duration-100"
      style={{
        top: position.top,
        left: position.left,
        maxHeight: maxH,
        overflowY: "auto",
      }}
    >
      <div className="px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/70">
        {title}
      </div>
      {children}
    </div>,
    document.body
  )
}

// --- Flyout item components ---

function FlyoutItem({
  href,
  icon: Icon,
  label,
  color,
  isActive,
  onClick,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
  isActive: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      )}
    >
      <Icon className={cn("size-4 shrink-0", color)} />
      <span className="truncate">{label}</span>
    </Link>
  )
}

function FlyoutAnchorItem({
  href,
  icon: Icon,
  label,
  color,
  isActive,
  onClick,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
  isActive: boolean
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      )}
    >
      <Icon className={cn("size-4 shrink-0", color)} />
      <span className="truncate">{label}</span>
    </a>
  )
}

// --- Tech Tools flyout with collapsible categories ---

function TechToolsFlyoutContent({
  pathname,
  activeCategoryId,
  onNavigate,
}: {
  pathname: string
  activeCategoryId: string | undefined
  onNavigate: () => void
}) {
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    () => new Set(activeCategoryId ? [activeCategoryId] : [])
  )

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <>
      {toolCategories.map((category: ToolCategory) => {
        const isExpanded = expandedCategories.has(category.id)
        return (
          <div key={category.id}>
            <button
              type="button"
              onClick={() => toggleCategory(category.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                activeCategoryId === category.id && "font-medium"
              )}
            >
              <category.icon className={cn("size-4 shrink-0", category.color)} />
              <span className="truncate">{category.title}</span>
              <ChevronRight
                className={cn(
                  "ml-auto size-3 shrink-0 transition-transform duration-200",
                  isExpanded && "rotate-90"
                )}
              />
            </button>
            {isExpanded && (
              <div className="ml-3 border-l border-sidebar-border pl-2">
                {category.tools.map((tool) => (
                  <FlyoutItem
                    key={tool.id}
                    href={tool.path}
                    icon={tool.icon}
                    label={tool.title}
                    color={getToolColor(tool.id)}
                    isActive={pathname === tool.path}
                    onClick={onNavigate}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
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

// --- Extracted menu item components that need refs for flyout ---

function SubNavMenuItem({
  app,
  isActiveApp,
  activeNavId,
  isCollapsed,
  router,
  closeMobileSidebar,
}: {
  app: AppConfig
  isActiveApp: boolean
  activeNavId?: string
  isCollapsed: boolean
  router: ReturnType<typeof useRouter>
  closeMobileSidebar: () => void
}) {
  const itemRef = React.useRef<HTMLLIElement>(null)
  const [flyoutOpen, setFlyoutOpen] = React.useState(false)

  // Close flyout when sidebar expands
  React.useEffect(() => {
    if (!isCollapsed) setFlyoutOpen(false)
  }, [isCollapsed])

  const handleIconClick = () => {
    if (isCollapsed) {
      setFlyoutOpen((prev) => !prev)
    }
  }

  const closeFlyout = () => setFlyoutOpen(false)

  const handleFlyoutNavigate = () => {
    closeFlyout()
    closeMobileSidebar()
  }

  return (
    <Collapsible
      asChild
      defaultOpen={isActiveApp}
      className="group/collapsible"
    >
      <SidebarMenuItem ref={itemRef}>
        {isCollapsed ? (
          // When collapsed: click opens flyout, no collapsible toggle
          <SidebarMenuButton
            tooltip={flyoutOpen ? undefined : app.name}
            isActive={isActiveApp}
            onClick={handleIconClick}
          >
            <app.icon className={cn(app.color)} />
            <span>{app.name}</span>
          </SidebarMenuButton>
        ) : (
          // When expanded: normal collapsible trigger behavior
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={app.name} isActive={isActiveApp}>
              <app.icon className={cn(app.color)} />
              <span>{app.name}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
        )}
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
                          closeMobileSidebar()
                          router.push(`/#${navItem.id}`)
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
                    <Link href={href} prefetch={false} onClick={closeMobileSidebar}>
                      <navItem.icon className={cn("size-4", navItem.color)} />
                      <span>{navItem.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>

        <CollapsedFlyout triggerRef={itemRef} open={flyoutOpen} onClose={closeFlyout} title={app.name}>
          {app.navItems.map((navItem: NavItem) => {
            const isActiveNav = isActiveApp && activeNavId === navItem.id

            if (app.id === "portfolio") {
              return (
                <FlyoutAnchorItem
                  key={navItem.id}
                  href={`/#${navItem.id}`}
                  icon={navItem.icon}
                  label={navItem.label}
                  color={navItem.color}
                  isActive={isActiveNav}
                  onClick={(e) => {
                    e.preventDefault()
                    handleFlyoutNavigate()
                    router.push(`/#${navItem.id}`)
                  }}
                />
              )
            }

            const href = navItem.url ?? `/${app.id}/${navItem.id}`
            return (
              <FlyoutItem
                key={navItem.id}
                href={href}
                icon={navItem.icon}
                label={navItem.label}
                color={navItem.color}
                isActive={isActiveNav}
                onClick={handleFlyoutNavigate}
              />
            )
          })}
        </CollapsedFlyout>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function TechToolsMenuItem({
  app,
  isActiveApp,
  isCollapsed,
  pathname,
  activeCategoryId,
  closeMobileSidebar,
}: {
  app: AppConfig
  isActiveApp: boolean
  isCollapsed: boolean
  pathname: string
  activeCategoryId: string | undefined
  closeMobileSidebar: () => void
}) {
  const itemRef = React.useRef<HTMLLIElement>(null)
  const [flyoutOpen, setFlyoutOpen] = React.useState(false)

  // Close flyout when sidebar expands
  React.useEffect(() => {
    if (!isCollapsed) setFlyoutOpen(false)
  }, [isCollapsed])

  const handleIconClick = () => {
    if (isCollapsed) {
      setFlyoutOpen((prev) => !prev)
    }
  }

  const closeFlyout = () => setFlyoutOpen(false)

  const handleFlyoutNavigate = () => {
    closeFlyout()
    closeMobileSidebar()
  }

  return (
    <Collapsible
      asChild
      defaultOpen={isActiveApp}
      className="group/collapsible"
    >
      <SidebarMenuItem ref={itemRef}>
        {isCollapsed ? (
          <SidebarMenuButton
            tooltip={flyoutOpen ? undefined : app.name}
            isActive={isActiveApp}
            onClick={handleIconClick}
          >
            <app.icon className={cn(app.color)} />
            <span>{app.name}</span>
          </SidebarMenuButton>
        ) : (
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={app.name} isActive={isActiveApp}>
              <app.icon className={cn(app.color)} />
              <span>{app.name}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
        )}
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
                      <SidebarMenuSubButton isActive={isCategoryActive}>
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
                                <Link href={tool.path} prefetch={false} onClick={closeMobileSidebar}>
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

        <CollapsedFlyout triggerRef={itemRef} open={flyoutOpen} onClose={closeFlyout} title={app.name}>
          <TechToolsFlyoutContent
            pathname={pathname}
            activeCategoryId={activeCategoryId}
            onNavigate={handleFlyoutNavigate}
          />
        </CollapsedFlyout>
      </SidebarMenuItem>
    </Collapsible>
  )
}
