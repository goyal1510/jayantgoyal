"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, Settings, Trash2, Lock, User } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    isGuest: boolean;
  };
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [isSigningOut, startSigningOut] = React.useTransition();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [displayName, setDisplayName] = React.useState(user.name);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const canOpenSettings = !user.isGuest;

  const nameForUi = displayName || user.name;

  const handleSignOut = React.useCallback(() => {
    startSigningOut(() => {
      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase.auth.signOut();
          if (error) {
            toast.error(error.message);
            return;
          }
          router.push("/login");
          router.refresh();
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unable to sign out.";
          toast.error(message);
        }
      })();
    });
  }, [router]);

  React.useEffect(() => {
    const normalizedName = user.name?.trim() ?? "";
    const [first = "", ...rest] = normalizedName.split(" ").filter(Boolean);
    setFirstName(first);
    setLastName(rest.join(" "));
    setDisplayName(normalizedName);
  }, [user.email, user.name]);

  const handleSave = React.useCallback(() => {
    if (user.isGuest) {
      toast.error("Guest accounts cannot update profile details.");
      return;
    }

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const hasPasswordChange = newPassword.length > 0;

    if (hasPasswordChange && newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (hasPasswordChange && newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSaving(true);

    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const payload: Parameters<typeof supabase.auth.updateUser>[0] = {
          data: {
            first_name: trimmedFirst,
            last_name: trimmedLast,
            full_name: `${trimmedFirst} ${trimmedLast}`.trim(),
          },
        };

        if (hasPasswordChange) {
          payload.password = newPassword;
        }

        const { error, data } = await supabase.auth.updateUser(payload);

        if (error) {
          toast.error(error.message);
          return;
        }

        const updatedName =
          `${trimmedFirst} ${trimmedLast}`.trim() ||
          data?.user?.user_metadata?.full_name ||
          user.name;

        setDisplayName(updatedName);
        setIsSettingsOpen(false);
        toast.success("Changes saved.");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to update profile.";
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
    })();
  }, [
    confirmPassword,
    firstName,
    lastName,
    newPassword,
    user.isGuest,
    user.name,
  ]);

  const handleDeleteAccount = React.useCallback(() => {
    if (user.isGuest) {
      toast.error("Guest accounts cannot be deleted.");
      return;
    }

    setIsDeleting(true);

    void (async () => {
      try {
        const response = await fetch("/api/account/delete", {
          method: "DELETE",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(payload?.error || "Unable to delete account.");
        }

        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();

        toast.success("Account deleted.");
        setIsSettingsOpen(false);
        router.push("/login");
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to delete account.";
        toast.error(message);
      } finally {
        setIsDeleting(false);
      }
    })();
  }, [router, user.isGuest]);

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
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
                    <User className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{nameForUi}</span>
                </div>
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
                <DropdownMenuItem disabled className="gap-2">
                  <Settings className="size-4" />
                  Settings
                  <Lock className="size-4" />
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  handleSignOut();
                }}
                disabled={isSigningOut || isDeleting || isSaving}
              >
                <LogOut />
                {isSigningOut ? "Signing out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {canOpenSettings ? (
            <SheetContent
              side={isMobile ? "bottom" : "right"}
              className="sm:max-w-md"
            >
              <SheetHeader className="p-6 pb-2">
                <SheetTitle>Account settings</SheetTitle>
                <SheetDescription>
                  Update your profile details.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-6">
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
            </SheetContent>
          ) : null}
        </Sheet>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
