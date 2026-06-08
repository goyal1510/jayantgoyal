"use client"

import React from "react"
import Link from "next/link"
import { ChevronRight, Star } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import type { AppConfig } from "@/lib/config/hub-config"
import { toolCategories } from "@/lib/tools/tools"
import type { ToolCategory } from "@/lib/tools/tools"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/collapsible"
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@repo/ui/sidebar"

import { CollapsedFlyout } from "./collapsed-flyout"
import { FlyoutItem } from "./flyout-items"
import { getToolColor } from "./tool-colors"

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
      <FlyoutItem
        href="/tools/workspace"
        icon={Star}
        label="Workspace"
        color="text-amber-500 dark:text-amber-400"
        isActive={pathname === "/tools/workspace"}
        onClick={onNavigate}
      />
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

export function TechToolsMenuItem({
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
            <SidebarMenuSubItem>
              <SidebarMenuSubButton asChild isActive={pathname === "/tools/workspace"}>
                <Link href="/tools/workspace" prefetch={false} onClick={closeMobileSidebar}>
                  <Star className="size-4 text-amber-500 dark:text-amber-400" />
                  <span>Workspace</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
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
