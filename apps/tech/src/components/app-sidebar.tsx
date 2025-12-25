"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Code2 } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { toolCategories } from "@/lib/tools"

const teams = [
  {
    name: "Tech",
    logo: Code2,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const activeUrl = pathname || "/"

  // Build nav items from tool categories
  const navItems = toolCategories.map((category) => ({
    title: category.title,
    url: `#${category.id}`,
    icon: category.icon as React.ElementType,
    items: category.tools.map((tool) => ({
      title: tool.title,
      url: tool.path,
    })),
  }))

  // Determine which category should be open based on active tool
  const activeCategoryId = toolCategories.find((category) =>
    category.tools.some((tool) => tool.path === activeUrl)
  )?.id

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} activeUrl={activeUrl} activeId={activeCategoryId} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
