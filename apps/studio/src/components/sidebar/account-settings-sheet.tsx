"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Trash2, Eye, EyeOff, Info } from "lucide-react"

import { Button } from "@repo/ui/button"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/sheet"
import { Separator } from "@repo/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/tooltip"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { MfaSettingsSection } from "@/components/auth/mfa-settings-section"
import { MfaVerifyDialog } from "@/components/auth/mfa-verify-dialog"
import { toast } from "sonner"

interface AccountSettingsSheetProps {
  userName: string
  onNameChange: (name: string) => void
  onClose: () => void
  isOpen: boolean
}

export function AccountSettingsSheet({
  userName,
  onNameChange,
  onClose,
  isOpen,
}: AccountSettingsSheetProps) {
  const router = useRouter()
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isMfaEnabled, setIsMfaEnabled] = React.useState(false)
  const [mfaVerifyOpen, setMfaVerifyOpen] = React.useState(false)
  const [pendingAction, setPendingAction] = React.useState<"save" | "delete" | null>(null)

  // Reset fields when sheet opens/closes
  React.useEffect(() => {
    if (isOpen) {
      const [first = "", ...rest] = userName.trim().split(" ").filter(Boolean)
      setFirstName(first)
      setLastName(rest.join(" "))
    }
    setNewPassword("")
    setConfirmPassword("")
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

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
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error("Not authenticated.")
          return
        }

        const { error: profileError } = await supabase
          .schema("jg_account")
          .from("profiles")
          .update({ first_name: trimmedFirst, last_name: trimmedLast })
          .eq("user_id", user.id)

        if (profileError) {
          toast.error(profileError.message)
          return
        }

        if (hasPasswordChange) {
          const { error: authError } = await supabase.auth.updateUser({
            password: newPassword,
          })
          if (authError) {
            toast.error(authError.message)
            return
          }
        }

        onNameChange(`${trimmedFirst} ${trimmedLast}`.trim() || userName)
        onClose()
        toast.success("Changes saved.")
        setNewPassword("")
        setConfirmPassword("")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to update profile.")
      } finally {
        setIsSaving(false)
      }
    })()
  }, [confirmPassword, firstName, lastName, newPassword, userName, onNameChange, onClose])

  const executeDelete = React.useCallback(() => {
    setIsDeleting(true)

    void (async () => {
      try {
        const response = await fetch("/api/account/delete", { method: "DELETE" })
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(payload?.error || "Unable to delete account.")
        }

        const supabase = createSupabaseBrowserClient()
        await supabase.auth.signOut()
        toast.success("Account deleted.")
        onClose()
        router.push("/")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to delete account.")
      } finally {
        setIsDeleting(false)
      }
    })()
  }, [router, onClose])

  const handleSave = React.useCallback(() => {
    if (isMfaEnabled && newPassword.length > 0) {
      setPendingAction("save")
      setMfaVerifyOpen(true)
      return
    }
    executeSave()
  }, [newPassword, isMfaEnabled, executeSave])

  const handleDeleteAccount = React.useCallback(() => {
    if (isMfaEnabled) {
      setPendingAction("delete")
      setMfaVerifyOpen(true)
      return
    }
    executeDelete()
  }, [isMfaEnabled, executeDelete])

  const handleMfaVerified = React.useCallback(() => {
    if (pendingAction === "save") executeSave()
    else if (pendingAction === "delete") executeDelete()
    setPendingAction(null)
  }, [pendingAction, executeSave, executeDelete])

  return (
    <SheetContent side="right" className="sm:max-w-md">
      <SheetHeader className="p-6 pb-2">
        <SheetTitle>Account settings</SheetTitle>
        <SheetDescription>Update your profile details.</SheetDescription>
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
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last-name">Last name</Label>
            <Input
              id="last-name"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
              onChange={(e) => setNewPassword(e.target.value)}
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
              onChange={(e) => setConfirmPassword(e.target.value)}
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
  )
}
