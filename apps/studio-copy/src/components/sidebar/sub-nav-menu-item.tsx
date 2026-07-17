"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import type { AppConfig, NavItem } from "@/lib/config/hub-config"

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
import { FlyoutItem, FlyoutAnchorItem } from "./flyout-items"

export function SubNavMenuItem({
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
                          // Delay scroll to let sidebar close animation finish
                          requestAnimationFrame(() => {
                            const el = document.getElementById(navItem.id)
                            if (el) {
                              const top = el.getBoundingClientRect().top + window.scrollY - 80
                              window.scrollTo({ top, behavior: "smooth" })
                              window.history.replaceState(null, "", `/#${navItem.id}`)
                            } else {
                              router.push(`/#${navItem.id}`)
                            }
                          })
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
                    const el = document.getElementById(navItem.id)
                    if (el) {
                      const top = el.getBoundingClientRect().top + window.scrollY - 80
                      window.scrollTo({ top, behavior: "smooth" })
                      window.history.replaceState(null, "", `/#${navItem.id}`)
                    } else {
                      router.push(`/#${navItem.id}`)
                    }
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
