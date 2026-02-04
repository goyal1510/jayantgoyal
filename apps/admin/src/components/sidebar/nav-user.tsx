"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, LogOut, Settings, User } from "lucide-react"

import {
  Avatar,
  AvatarFallback,
} from "@repo/ui/avatar"
import { Button } from "@repo/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui/sidebar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/sheet"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function NavUser({
  user,
}: {
  user: {
    email: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [isSigningOut, startSigningOut] = React.useTransition()
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

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
          router.push("/login")
          router.refresh()
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unable to sign out."
          toast.error(message)
        }
      })()
    })
  }, [router])

  const handleSave = React.useCallback(() => {
    const hasPasswordChange = newPassword.length > 0

    if (hasPasswordChange && newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }

    if (hasPasswordChange && newPassword !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    if (!hasPasswordChange) {
      setIsSettingsOpen(false)
      return
    }

    setIsSaving(true)

    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        })

        if (error) {
          toast.error(error.message)
          return
        }

        setIsSettingsOpen(false)
        toast.success("Password updated.")
        setNewPassword("")
        setConfirmPassword("")
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to update password."
        toast.error(message)
      } finally {
        setIsSaving(false)
      }
    })()
  }, [confirmPassword, newPassword])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <User className="size-4" />
                <span className="truncate font-semibold">{user.email}</span>
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
                <DropdownMenuItem
                  onSelect={(event) => event.preventDefault()}
                  className="gap-2"
                >
                  <Settings className="size-4" />
                  Settings
                </DropdownMenuItem>
              </SheetTrigger>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  handleSignOut()
                }}
                disabled={isSigningOut || isSaving}
                className="group/logout"
              >
                <LogOut className="transition-transform duration-200 group-hover/logout:translate-x-0.5" />
                <span className="text-destructive">{isSigningOut ? "Signing out..." : "Log out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <SheetContent
            side={isMobile ? "bottom" : "right"}
            className="sm:max-w-md"
          >
            <SheetHeader className="p-6 pb-2">
              <SheetTitle>Account settings</SheetTitle>
              <SheetDescription>
                Update your password.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-6">
              <div className="grid gap-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <SheetFooter className="p-6 pt-2">
              <Button
                type="button"
                className="flex-1"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
