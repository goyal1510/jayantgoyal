"use client"

import * as React from "react"
import {
  // AudioWaveform,
  BookOpen,
  Bot,
  // Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { usePortfolioData } from "@/lib/use-portfolio-data"
import { toast } from "sonner"

// This is sample data.
const fallbackSidebarData = {
  user: {
    name: "Guest",
    email: "guest@example.com",
    isGuest: false,
  },
  teams: [
    {
      name: "Portfolio",
      logo: GalleryVerticalEnd,
      // plan: "Enterprise",
    },
    // {
    //   name: "Acme Corp.",
    //   logo: AudioWaveform,
    //   plan: "Startup",
    // },
    // {
    //   name: "Evil Corp.",
    //   logo: Command,
    //   plan: "Free",
    // },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: portfolioData } = usePortfolioData()

  const [user, setUser] = React.useState<typeof fallbackSidebarData.user | null>(
    null
  )
  const [isUserLoading, setIsUserLoading] = React.useState(true)
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
    let isMounted = true

    const loadUser = async () => {
      try {
        setIsUserLoading(true)
        const response = await fetch("/api/account/profile", {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Failed to load user profile.")
        }

        const payload = (await response.json()) as
          | { user?: { name?: string; email?: string; isGuest?: boolean } }
          | undefined

        if (!isMounted) return

        const resolvedName =
          payload?.user?.name?.trim() || fallbackSidebarData.user.name
        const resolvedEmail =
          payload?.user?.email?.trim() || fallbackSidebarData.user.email

        if (!payload?.user) {
          setUser(null)
          return
        }

        setUser({
          name: resolvedName,
          email: resolvedEmail,
          isGuest: Boolean(payload.user.isGuest),
        })
      } catch {
        // Show a toast and keep fallback user state as null.
        if (!isMounted) return
        toast.error("Unable to load user profile.")
        setUser(null)
      } finally {
        if (!isMounted) return
        setIsUserLoading(false)
      }
    }

    void loadUser()

    return () => {
      isMounted = false
    }
  }, [])

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
        {isUserLoading ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="gap-2"
                aria-disabled
                data-loading="true"
              >
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
                  <Skeleton className="h-4 w-24" />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : user ? (
          <NavUser user={user} />
        ) : (
          <div className="px-4 pb-4 text-xs text-muted-foreground">
            Unable to load user
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
