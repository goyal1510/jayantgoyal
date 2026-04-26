"use client"

import * as React from "react"
import { ChevronsUpDown, LogOut, Settings, User } from "lucide-react"

import { Avatar, AvatarFallback } from "@repo/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@repo/ui/sidebar"
import { Sheet, SheetTrigger } from "@repo/ui/sheet"
import { AccountSettingsSheet } from "@/components/sidebar/account-settings-sheet"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
  }
}) {
  const { isMobile } = useSidebar()
  const [isSigningOut, startSigningOut] = React.useTransition()
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [displayName, setDisplayName] = React.useState(user.name)

  React.useEffect(() => {
    setDisplayName(user.name?.trim() || "User")
  }, [user.name])

  const handleSignOut = React.useCallback(() => {
    startSigningOut(() => {
      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient()
          const { error } = await supabase.auth.signOut()
          if (error) {
            toast.error(error.message)
            return
          }
          window.location.href = "/welcome?signed_out=true"
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Unable to sign out.")
        }
      })()
    })
  }, [])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <User className="size-4" />
                <span className="truncate font-semibold">{displayName}</span>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
                      <User className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <SheetTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2">
                  <Settings className="size-4" />
                  Settings
                </DropdownMenuItem>
              </SheetTrigger>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); handleSignOut() }}
                disabled={isSigningOut}
                className="group/logout"
              >
                <LogOut className="transition-transform duration-200 group-hover/logout:translate-x-0.5" />
                <span className="text-destructive">{isSigningOut ? "Signing out..." : "Log out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AccountSettingsSheet
            userName={displayName}
            onNameChange={setDisplayName}
            onClose={() => setIsSettingsOpen(false)}
            isOpen={isSettingsOpen}
          />
        </Sheet>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
