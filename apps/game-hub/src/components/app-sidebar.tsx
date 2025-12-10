"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Gauge,
  Gamepad2,
  Grid3X3,
  HandHeart,
  History,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
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
import { toast } from "sonner"

const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Gauge,
    isActive: false,
  },
  {
    title: "Rock Paper Scissors",
    url: "/rock-paper-scissors",
    icon: Gamepad2,
  },
  {
    title: "Tic Tac Toe",
    url: "/tic-tac-toe",
    icon: Grid3X3,
  },
  {
    title: "Dare X",
    url: "/dare-x",
    icon: HandHeart,
  }
]

const teams = [
  {
    name: "Game Hub",
    logo: Gamepad2,
  },
]

const fallbackUser = {
  name: "Guest",
  email: "guest@example.com",
  isGuest: false,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const [user, setUser] = React.useState<typeof fallbackUser | null>(null)
  const [isUserLoading, setIsUserLoading] = React.useState(true)
  const activeUrl = pathname || "/"

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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} activeUrl={activeUrl} />
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
