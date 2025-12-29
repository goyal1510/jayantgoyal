"use client"

import * as React from "react"
import {
  Frame,
  GalleryVerticalEnd,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { usePortfolioData } from "@/lib/use-portfolio-data"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: portfolioData } = usePortfolioData()
  const navItems = React.useMemo(
    () =>
      portfolioData.NAV_ITEMS.map((item, index) => ({
        title: item.label,
        url: `#${item.id}`,
        icon: item.icon,
        iconColor: item.color,
        isActive: index === 0,
      })),
    [portfolioData.NAV_ITEMS]
  )
  const projectNavItems = React.useMemo(
    () =>
      portfolioData.PROJECTS.map((project) => ({
        name: project.name,
        url: project.liveLink || "#projects",
        icon: Frame,
      })),
    [portfolioData.PROJECTS]
  )
  const sectionIds = React.useMemo(
    () => portfolioData.NAV_ITEMS.map((item) => item.id),
    [portfolioData.NAV_ITEMS]
  )
  const teams = React.useMemo(
    () => [
      {
        name: portfolioData.HERO.name,
        logo: GalleryVerticalEnd,
      },
    ],
    [portfolioData.HERO.name]
  )
  const [activeSection, setActiveSection] = React.useState(sectionIds[0] ?? "")


  React.useEffect(() => {
    if (!sectionIds.length) return

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

      if (visible[0]?.target.id) {
        setActiveSection(visible[0].target.id)
      }
    }, {
      rootMargin: "-30% 0px -40% 0px",
      threshold: [0.15, 0.3, 0.5],
    })

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sectionIds])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} activeId={activeSection} />
        <NavProjects projects={projectNavItems} />
      </SidebarContent>
      <SidebarFooter>
        {/* User section removed - portfolio is public */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
