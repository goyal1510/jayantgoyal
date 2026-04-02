"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, LogOut, Settings, Trash2, Lock, User, UserPlus, Eye, EyeOff, Info } from "lucide-react"

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
import { Separator } from "@repo/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/tooltip"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { MfaSettingsSection } from "@/components/auth/mfa-settings-section"
import { MfaVerifyDialog } from "@/components/auth/mfa-verify-dialog"
import { toast } from "sonner"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    isGuest: boolean
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [isSigningOut, startSigningOut] = React.useTransition()
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [displayName, setDisplayName] = React.useState(user.name)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isMfaEnabled, setIsMfaEnabled] = React.useState(false)
  const [mfaVerifyOpen, setMfaVerifyOpen] = React.useState(false)
  const [pendingAction, setPendingAction] = React.useState<"save" | "delete" | null>(null)
  const canOpenSettings = !user.isGuest

  const nameForUi = displayName || user.name

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
          window.location.href = "/login?message=signed_out"
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unable to sign out."
          toast.error(message)
        }
      })()
    })
  }, [router])

  React.useEffect(() => {
    const normalizedName = user.name?.trim() ?? ""
    const [first = "", ...rest] = normalizedName.split(" ").filter(Boolean)
    setFirstName(first)
    setLastName(rest.join(" "))
    setDisplayName(normalizedName)
  }, [user.email, user.name])

  // Reset all fields when the sheet opens (to current user data) or closes
  React.useEffect(() => {
    if (isSettingsOpen) {
      const normalizedName = (displayName || user.name)?.trim() ?? ""
      const [first = "", ...rest] = normalizedName.split(" ").filter(Boolean)
      setFirstName(first)
      setLastName(rest.join(" "))
    }
    setNewPassword("")
    setConfirmPassword("")
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }, [isSettingsOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const executeSave = React.useCallback(() => {
    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const hasPasswordChange = newPassword.length > 0

    if (hasPasswordChange) {
      if (newPassword.length < 8) {
        toast.error("Password must be at least 8 characters.")
        return
      }
      if (!/[A-Z]/.test(newPassword)) {
        toast.error("Password must contain at least one uppercase letter.")
        return
      }
      if (!/[0-9]/.test(newPassword)) {
        toast.error("Password must contain at least one number.")
        return
      }
      if (!/[^A-Za-z0-9]/.test(newPassword)) {
        toast.error("Password must contain at least one special character.")
        return
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match.")
        return
      }
    }

    setIsSaving(true)

    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient()

        // Update name in jg_account.profiles
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          toast.error("Not authenticated.")
          return
        }

        const { error: profileError } = await supabase
          .schema("jg_account")
          .from("profiles")
          .update({ first_name: trimmedFirst, last_name: trimmedLast })
          .eq("user_id", currentUser.id)

        if (profileError) {
          toast.error(profileError.message)
          return
        }

        // Update password via auth if changed
        if (hasPasswordChange) {
          const { error: authError } = await supabase.auth.updateUser({
            password: newPassword,
          })
          if (authError) {
            toast.error(authError.message)
            return
          }
        }

        const updatedName =
          `${trimmedFirst} ${trimmedLast}`.trim() || user.name

        setDisplayName(updatedName)
        setIsSettingsOpen(false)
        toast.success("Changes saved.")
        setNewPassword("")
        setConfirmPassword("")
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to update profile."
        toast.error(message)
      } finally {
        setIsSaving(false)
      }
    })()
  }, [
    confirmPassword,
    firstName,
    lastName,
    newPassword,
    user.name,
  ])

  const executeDelete = React.useCallback(() => {
    setIsDeleting(true)

    void (async () => {
      try {
        const response = await fetch("/api/account/delete", {
          method: "DELETE",
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null
          throw new Error(payload?.error || "Unable to delete account.")
        }

        const supabase = createSupabaseBrowserClient()
        await supabase.auth.signOut()

        toast.success("Account deleted.")
        setIsSettingsOpen(false)
        router.push("/")
        router.refresh()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to delete account."
        toast.error(message)
      } finally {
        setIsDeleting(false)
      }
    })()
  }, [router])

  const handleSave = React.useCallback(() => {
    if (user.isGuest) {
      toast.error("Guest accounts cannot update profile details.")
      return
    }
    const hasPasswordChange = newPassword.length > 0
    if (isMfaEnabled && hasPasswordChange) {
      setPendingAction("save")
      setMfaVerifyOpen(true)
      return
    }
    executeSave()
  }, [user.isGuest, newPassword, isMfaEnabled, executeSave])

  const handleDeleteAccount = React.useCallback(() => {
    if (user.isGuest) {
      toast.error("Guest accounts cannot be deleted.")
      return
    }
    if (isMfaEnabled) {
      setPendingAction("delete")
      setMfaVerifyOpen(true)
      return
    }
    executeDelete()
  }, [user.isGuest, isMfaEnabled, executeDelete])

  const handleMfaVerified = React.useCallback(() => {
    if (pendingAction === "save") {
      executeSave()
    } else if (pendingAction === "delete") {
      executeDelete()
    }
    setPendingAction(null)
  }, [pendingAction, executeSave, executeDelete])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Sheet
          open={canOpenSettings ? isSettingsOpen : false}
          onOpenChange={canOpenSettings ? setIsSettingsOpen : undefined}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <User className="size-4" />
                <span className="truncate font-semibold">{nameForUi}</span>
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
              {canOpenSettings ? (
                <SheetTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(event) => event.preventDefault()}
                    className="gap-2"
                  >
                    <Settings className="size-4" />
                    Settings
                  </DropdownMenuItem>
                </SheetTrigger>
              ) : (
                <>
                  <DropdownMenuItem disabled className="gap-2">
                    <Settings className="size-4" />
                    Settings
                    <Lock className="size-4" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => router.push("/signup")}
                    className="gap-2"
                  >
                    <UserPlus className="size-4" />
                    Create your account
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  handleSignOut()
                }}
                disabled={isSigningOut || isDeleting || isSaving}
                className="group/logout"
              >
                <LogOut className="transition-transform duration-200 group-hover/logout:translate-x-0.5" />
                <span className="text-destructive">{isSigningOut ? "Signing out..." : "Log out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {canOpenSettings ? (
            <SheetContent
              side="right"
              className="sm:max-w-md"
            >
              <SheetHeader className="p-6 pb-2">
                <SheetTitle>Account settings</SheetTitle>
                <SheetDescription>
                  Update your profile details.
                </SheetDescription>
              </SheetHeader>

              {/* Profile Section */}
              <div className="space-y-4 px-6">
                <h3 className="text-sm font-medium">Profile</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="first-name">First name</Label>
                    <Input
                      id="first-name"
                      name="firstName"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input
                      id="last-name"
                      name="lastName"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
              </div>

              <Separator className="mx-6 w-auto" />

              {/* Security Section */}
              <div className="space-y-4 px-6">
                <h3 className="text-sm font-medium">Security</h3>
                <div className="grid gap-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="new-password">New password</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="text-muted-foreground size-3.5 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-56 text-xs">
                        <ul className="space-y-0.5">
                          <li>At least 8 characters</li>
                          <li>One uppercase letter</li>
                          <li>One number</li>
                          <li>One special character</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="relative">
                    <Input
                      id="new-password"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      className={`pr-16 ${newPassword.length > 0 ? (newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword) ? "border-green-500 focus-visible:ring-green-500" : "border-destructive focus-visible:ring-destructive") : ""}`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer transition-colors"
                      onClick={() => setShowNewPassword((v) => !v)}
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      className={`pr-16 ${confirmPassword.length > 0 ? (newPassword === confirmPassword ? "border-green-500 focus-visible:ring-green-500" : "border-destructive focus-visible:ring-destructive") : ""}`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer transition-colors"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <MfaSettingsSection onStatusChange={setIsMfaEnabled} />
              </div>

              <SheetFooter className="p-6 pt-2 flex-row flex-wrap items-center gap-3">
                <Button
                  type="button"
                  className="flex-1 min-w-[140px]"
                  onClick={handleSave}
                  disabled={isSaving || isDeleting}
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1 min-w-[140px] justify-between"
                  onClick={handleDeleteAccount}
                  disabled={isSaving || isDeleting}
                >
                  <span>{isDeleting ? "Deleting..." : "Delete account"}</span>
                  <Trash2 className="size-4" />
                </Button>
              </SheetFooter>

              <MfaVerifyDialog
                open={mfaVerifyOpen}
                onOpenChange={(open) => {
                  setMfaVerifyOpen(open)
                  if (!open) setPendingAction(null)
                }}
                onVerified={handleMfaVerified}
              />
            </SheetContent>
        ) : null}
        </Sheet>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
