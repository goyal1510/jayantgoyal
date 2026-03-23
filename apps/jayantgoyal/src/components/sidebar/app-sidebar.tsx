"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, LayoutGrid, LogIn, User } from "lucide-react"

import { NavApps } from "@/components/sidebar/nav-apps"
import { NavUser } from "@/components/sidebar/nav-user"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@repo/ui/sidebar"
import { Separator } from "@repo/ui/separator"
import { Skeleton } from "@repo/ui/skeleton"
import { HUB_APPS } from "@/lib/config/hub-config"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { TermsDialog } from "@/components/auth/terms-dialog"

const fallbackUser = {
  name: "Guest",
  email: "guest@example.com",
  isGuest: false,
}

// Module-level cache to avoid re-fetching on every navigation
let cachedUser: typeof fallbackUser | null | undefined = undefined

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const allApps = React.useMemo(() => HUB_APPS, [])

  // User state — initialize from module cache to avoid flicker on navigation
  const [user, setUser] = React.useState<typeof fallbackUser | null>(cachedUser ?? null)
  const [isUserLoading, setIsUserLoading] = React.useState(cachedUser === undefined)

  // Load user profile. `silent` skips the loading skeleton so NavUser
  // stays mounted and its local state (settings sheet, MFA dialog) is preserved.
  const loadUser = React.useCallback(async (silent = false, retries = 2) => {
    try {
      if (!silent) setIsUserLoading(true)
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

      const userData = {
        name: resolvedName,
        email: resolvedEmail,
        isGuest: Boolean(payload.user.isGuest),
      }
      cachedUser = userData
      setUser(userData)
    } catch {
      // Retry before giving up
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 500))
        return loadUser(true, retries - 1)
      }
      // Final fallback: if there's an active session, show email-based user
      // instead of "Login" button
      const supabase = createSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const email = session.user.email || ""
        const userData = {
          name: email.split("@")[0] || "User",
          email,
          isGuest: session.user.is_anonymous === true,
        }
        cachedUser = userData
        setUser(userData)
      } else {
        cachedUser = null
        setUser(null)
      }
    } finally {
      setIsUserLoading(false)
    }
  }, [])

  // Initial load and auth state listener
  React.useEffect(() => {
    // Skip initial fetch if we already have cached data
    if (cachedUser === undefined) {
      void loadUser()
    }

    // Listen for auth state changes (login/logout/session restore)
    const supabase = createSupabaseBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        cachedUser = undefined
        setUser(null)
        setIsUserLoading(false)
      } else if (event === "INITIAL_SESSION") {
        // Fires on page load when restoring session from cookies.
        // Only fetch if we don't have cached data (avoids double-fetch).
        if (session && !cachedUser) {
          void loadUser()
        }
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        cachedUser = undefined
        void loadUser()
        if (event === "SIGNED_IN") {
          void fetch("/api/account/mfa-cleanup", { method: "POST" })
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadUser])

  // Determine active app and nav based on current pathname
  const { activeAppId, activeNavId } = React.useMemo(() => {
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

    // Check for messenger routes
    if (pathname === "/messenger" || pathname.startsWith("/messenger/")) {
      return {
        activeAppId: "sync-messenger",
        activeNavId: "messenger",
      }
    }

    // Check for currency calculator routes
    if (pathname.startsWith("/calculator")) {
      return {
        activeAppId: "currency-calculator",
        activeNavId: pathname === "/calculator/new" ? "new" : "history",
      }
    }

    // Check for activity tracker routes
    if (pathname.startsWith("/activity-tracker")) {
      let navId = "dashboard"
      if (pathname.includes("/tracker")) navId = "tracker"
      else if (pathname.includes("/management")) navId = "management"
      return {
        activeAppId: "activity-tracker",
        activeNavId: navId,
      }
    }

    // Check for file manager routes
    if (pathname === "/files" || pathname.startsWith("/files/")) {
      return {
        activeAppId: "file-manager",
        activeNavId: pathname === "/files/changelog" ? "changelog" : "files",
      }
    }

    // Check for weather route
    if (pathname === "/weather") {
      return {
        activeAppId: "weather",
        activeNavId: undefined,
      }
    }

    // Check for github-stats route
    if (pathname === "/github-stats") {
      return {
        activeAppId: "github-stats",
        activeNavId: undefined,
      }
    }

    // Check for custom calculator route
    if (pathname === "/custom-calculator") {
      return {
        activeAppId: "custom-calculator",
        activeNavId: undefined,
      }
    }

    // Default to portfolio for /portfolio path (or root redirect)
    if (pathname === "/" || pathname === "") {
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
  }, [pathname, allApps])

  // State for portfolio scroll tracking
  const [portfolioActiveSection, setPortfolioActiveSection] = React.useState("home")

  // Get section IDs for portfolio (scroll tracking)
  const portfolioApp = React.useMemo(
    () => allApps.find((app) => app.id === "portfolio"),
    [allApps]
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
      // Check if we've scrolled to the bottom of the page
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50

      // If at the bottom, highlight the last section (contact)
      if (isAtBottom && portfolioSectionIds.length > 0) {
        setPortfolioActiveSection(portfolioSectionIds[portfolioSectionIds.length - 1] || "home")
        return
      }

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
      name: "Jayant",
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
          apps={allApps}
          activeAppId={activeAppId}
          activeNavId={finalActiveNavId}
        />
      </SidebarContent>
      <Separator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <TermsDialog>
              <SidebarMenuButton className="w-full">
                <FileText className="size-4" />
                <span>Terms & Conditions</span>
              </SidebarMenuButton>
            </TermsDialog>
          </SidebarMenuItem>
        </SidebarMenu>
        {isUserLoading ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                aria-disabled
                data-loading="true"
              >
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 w-24" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : user ? (
          <NavUser user={user} />
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="group/login">
                <Link href="/login">
                  <User className="size-4" />
                  <span>Login</span>
                  <LogIn className="ml-auto size-4 text-green-600 transition-transform duration-200 group-hover/login:translate-x-0.5 dark:text-green-500" />
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
