"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, LogIn, User } from "lucide-react"

import { NavApps } from "@/components/sidebar/nav-apps"
import { NavUser } from "@/components/sidebar/nav-user"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getPrivateApps, getPublicApps } from "@/lib/config/hub-config"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

const fallbackUser = {
  name: "Guest",
  email: "guest@example.com",
  isGuest: false,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const privateApps = React.useMemo(() => getPrivateApps(), [])
  const publicApps = React.useMemo(() => getPublicApps(), [])

  // User state
  const [user, setUser] = React.useState<typeof fallbackUser | null>(null)
  const [isUserLoading, setIsUserLoading] = React.useState(true)

  // Load user profile
  const loadUser = React.useCallback(async () => {
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

      const resolvedName = payload?.user?.name?.trim() || fallbackUser.name
      const resolvedEmail = payload?.user?.email?.trim() || fallbackUser.email

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
      setUser(null)
    } finally {
      setIsUserLoading(false)
    }
  }, [])

  // Initial load and auth state listener
  React.useEffect(() => {
    void loadUser()

    // Listen for auth state changes (login/logout)
    const supabase = createSupabaseBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null)
        setIsUserLoading(false)
      } else if (event === "SIGNED_IN") {
        void loadUser()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadUser])

  // Determine active app and nav based on current pathname
  const { activeAppId, activeNavId } = React.useMemo(() => {
    const allApps = [...privateApps, ...publicApps]

    // Check for games routes
    if (pathname.startsWith("/games")) {
      const gameApp = allApps.find((app) => app.id === "game-hub")
      if (gameApp) {
        const activeNav = gameApp.navItems.find((nav) => nav.url === pathname)
        return {
          activeAppId: "game-hub",
          activeNavId: activeNav?.id ?? "dashboard",
        }
      }
    }

    // Check for tech tools routes
    if (pathname.startsWith("/tools")) {
      return {
        activeAppId: "tech-tools",
        activeNavId: undefined,
      }
    }

    // Default to portfolio for /portfolio path (or root redirect)
    if (pathname === "/portfolio" || pathname === "/" || pathname === "") {
      return { activeAppId: "portfolio", activeNavId: "home" }
    }

    // Check other apps by their nav item URLs
    for (const app of allApps) {
      for (const navItem of app.navItems) {
        if (navItem.url && pathname === navItem.url) {
          return { activeAppId: app.id, activeNavId: navItem.id }
        }
      }
    }

    return { activeAppId: "portfolio", activeNavId: "home" }
  }, [pathname, privateApps, publicApps])

  // State for portfolio scroll tracking
  const [portfolioActiveSection, setPortfolioActiveSection] = React.useState("home")

  // Get section IDs for portfolio (scroll tracking)
  const portfolioApp = React.useMemo(
    () => privateApps.find((app) => app.id === "portfolio"),
    [privateApps]
  )

  const portfolioSectionIds = React.useMemo(
    () => portfolioApp?.navItems.map((item) => item.id) ?? [],
    [portfolioApp]
  )

  // Robust scroll-based section tracking (Portfolio only)
  React.useEffect(() => {
    if (!portfolioSectionIds.length || activeAppId !== "portfolio") return

    // Function to determine which section is currently active
    const updateActiveSection = () => {
      // Get the scroll position with an offset (consider section active when its top reaches 20% from viewport top)
      const scrollPosition = window.scrollY + window.innerHeight * 0.2

      let currentSection = portfolioSectionIds[0] || "home"

      // Find the section that the user has scrolled into
      for (const sectionId of portfolioSectionIds) {
        const element = document.getElementById(sectionId)
        if (element) {
          const { offsetTop } = element
          if (scrollPosition >= offsetTop) {
            currentSection = sectionId
          }
        }
      }

      setPortfolioActiveSection(currentSection)
    }

    // Throttle scroll events for performance
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveSection()
          ticking = false
        })
        ticking = true
      }
    }

    // Wait for elements to be available, then setup
    const setupWithRetry = () => {
      const hasElements = portfolioSectionIds.some((id) => document.getElementById(id))
      if (!hasElements) {
        // Elements not yet rendered, retry
        setTimeout(setupWithRetry, 100)
        return
      }

      // Initial check
      updateActiveSection()

      // Listen for scroll
      window.addEventListener("scroll", handleScroll, { passive: true })
    }

    setupWithRetry()

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [portfolioSectionIds, activeAppId])

  // Compute final active nav ID (use scroll tracking for portfolio)
  const finalActiveNavId = activeAppId === "portfolio" ? portfolioActiveSection : activeNavId

  const hubBrand = React.useMemo(
    () => ({
      name: "JG Hub",
      logo: LayoutGrid,
    }),
    []
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher brand={hubBrand} />
      </SidebarHeader>
      <SidebarContent>
        <NavApps
          apps={privateApps}
          activeAppId={activeAppId}
          activeNavId={finalActiveNavId}
          label="Apps"
        />
        {publicApps.length > 0 && (
          <>
            <SidebarSeparator />
            <NavApps
              apps={publicApps}
              activeAppId={activeAppId}
              activeNavId={finalActiveNavId}
              label="Public"
            />
          </>
        )}
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
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Link href="/login">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
                      <User className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Login</span>
                  </div>
                  <LogIn className="ml-auto size-4" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
