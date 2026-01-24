"use client"

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
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    iconColor?: string
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
  activeId?: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigate</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const computedActive = activeId
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
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
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
                <a href={item.url}>
                  {item.icon ? (
                    <item.icon className={cn(item.iconColor)} />
                  ) : null}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
