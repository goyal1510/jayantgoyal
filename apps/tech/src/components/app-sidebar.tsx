"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Home } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Hello",
    url: "/hello",
    icon: Home,
    isActive: true,
  },
]

const teams = [
  {
    name: "Tech",
    logo: Home,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const activeUrl = !pathname || pathname === "/" ? "/hello" : pathname

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} activeUrl={activeUrl} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
