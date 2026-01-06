"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Database,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const navItems: {
  title: string
  url: string
  icon?: React.ElementType
  isActive?: boolean
}[] = [
  {
    title: "Users",
    url: "/users",
    icon: Users,
    isActive: true,
  },
]

const teams = [
  {
    name: "Supabase Manager",
    logo: Database,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const activeUrl = pathname || "/"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        {navItems.length > 0 && <NavMain items={navItems} activeUrl={activeUrl} />}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
