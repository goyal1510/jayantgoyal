"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import dynamic from "next/dynamic"
import { FileText, LayoutGrid, LogIn, User } from "lucide-react"

import { NavApps } from "@/components/sidebar/nav-apps"
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
import { useActiveApp } from "@/hooks/use-active-app"
import { useScrollTracking } from "@/hooks/use-scroll-tracking"

// Lazy-load heavy components — not needed for initial sidebar render
const NavUser = dynamic(() => import("@/components/sidebar/nav-user").then((m) => ({ default: m.NavUser })), { ssr: false })
const TermsDialog = dynamic(() => import("@/components/auth/terms-dialog").then((m) => ({ default: m.TermsDialog })), { ssr: false })

type SidebarUser = { name: string; email: string }

const fallbackUser: SidebarUser = { name: "User", email: "user@example.com" }

// Module-level cache to avoid re-fetching on every navigation
let cachedUser: SidebarUser | null | undefined = undefined

const publicApps = HUB_APPS.filter((app) => app.isPublic && !app.externalUrl)
const privateApps = HUB_APPS.filter((app) => !app.isPublic && !app.externalUrl)
const externalApps = HUB_APPS.filter((app) => app.externalUrl)

const hubBrand = { name: "Jayant", logo: LayoutGrid }

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { activeAppId, activeNavId } = useActiveApp(pathname, HUB_APPS)

  // Portfolio scroll tracking
  const portfolioSectionIds = React.useMemo(
    () => HUB_APPS.find((app) => app.id === "portfolio")?.navItems.map((item) => item.id) ?? [],
    []
  )
  const portfolioActiveSection = useScrollTracking(portfolioSectionIds, activeAppId === "portfolio")
  const finalActiveNavId = activeAppId === "portfolio" ? portfolioActiveSection : activeNavId

  // User state
  const [user, setUser] = React.useState<SidebarUser | null>(cachedUser ?? null)
  const [isUserLoading, setIsUserLoading] = React.useState(cachedUser === undefined)

  const loadUser = React.useCallback(async (silent = false, retries = 2) => {
    try {
      if (!silent) setIsUserLoading(true)
      const response = await fetch("/api/account/init", { cache: "no-store" })

      if (!response.ok) throw new Error("Failed to load user.")

      const payload = (await response.json()) as { user?: { name?: string; email?: string } } | undefined
      if (!payload?.user) {
        setUser(null)
        return
      }

      const userData: SidebarUser = {
        name: payload.user.name?.trim() || fallbackUser.name,
        email: payload.user.email?.trim() || fallbackUser.email,
      }
      cachedUser = userData
      setUser(userData)
    } catch {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 500))
        return loadUser(true, retries - 1)
      }
      cachedUser = null
      setUser(null)
    } finally {
      setIsUserLoading(false)
    }
  }, [])

  // Defer auth listener setup — don't block first paint with Supabase client init
  React.useEffect(() => {
    if (cachedUser === undefined) void loadUser()

    // Lazy-import Supabase client only when needed (after first paint)
    let unsubscribe: (() => void) | undefined
    void import("@/lib/supabase/client").then(({ createSupabaseBrowserClient }) => {
      const supabase = createSupabaseBrowserClient()
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
          cachedUser = undefined
          setUser(null)
          setIsUserLoading(false)
        } else if (event === "INITIAL_SESSION") {
          if (!cachedUser) void loadUser()
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          cachedUser = undefined
          void loadUser()
          if (event === "SIGNED_IN") {
            void fetch("/api/account/mfa-cleanup", { method: "POST" })
          }
        }
      })
      unsubscribe = () => subscription.unsubscribe()
    })

    return () => { unsubscribe?.() }
  }, [loadUser])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher brand={hubBrand} />
      </SidebarHeader>
      <SidebarContent>
        <NavApps apps={publicApps} activeAppId={activeAppId} activeNavId={finalActiveNavId} label="Explore" />
        <NavApps apps={privateApps} activeAppId={activeAppId} activeNavId={finalActiveNavId} label="Apps" />
        <NavApps apps={externalApps} activeAppId={activeAppId} activeNavId={finalActiveNavId} label="External" />
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
              <SidebarMenuButton aria-disabled data-loading="true">
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
                <Link href="/welcome">
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
