"use client"

import Link from "next/link"
import { ChevronRight, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

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

export function NavMain({
  items,
  activeId,
  activeUrl,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon | React.ElementType
    iconColor?: string
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
  activeId?: string
  activeUrl?: string
}) {
  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Navigate</SidebarGroupLabel> */}
      <SidebarMenu>
        {items.map((item) => {
          const computedActive = activeUrl
            ? activeUrl === item.url || activeUrl.startsWith(`${item.url}/`)
            : activeId
              ? item.url === `#${activeId}`
              : item.isActive

          return item.items?.length ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={computedActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon ? (
                      <item.icon className={cn(item.iconColor)} />
                    ) : null}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isSubItemActive = activeUrl === subItem.url
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={computedActive}
              >
                <Link href={item.url}>
                  {item.icon ? (
                    <item.icon className={cn(item.iconColor)} />
                  ) : null}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
