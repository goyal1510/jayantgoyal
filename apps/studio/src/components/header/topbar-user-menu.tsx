"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { toast } from "sonner";

import {
  buildAuthAccountSecurityUrl,
  buildAuthLogoutUrl,
  resolveAuthFlowOwner,
} from "@repo/auth/entry";
import { signOutSession } from "@repo/auth/logout";
import { Avatar, AvatarFallback } from "@repo/ui/avatar";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Sheet } from "@repo/ui/sheet";
import { Skeleton } from "@repo/ui/skeleton";

import { AccountSettingsSheet } from "@/components/sidebar/account-settings-sheet";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type StudioUser = { name: string; email: string };

const fallbackUser: StudioUser = { name: "User", email: "user@example.com" };
let cachedUser: StudioUser | null | undefined;

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "JG";
}

export function TopbarUserMenu() {
  const [user, setUser] = React.useState<StudioUser | null>(cachedUser ?? null);
  const [displayName, setDisplayName] = React.useState(
    cachedUser?.name ?? fallbackUser.name,
  );
  const [isUserLoading, setIsUserLoading] = React.useState(
    cachedUser === undefined,
  );
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isSigningOut, startSigningOut] = React.useTransition();
  const authOwnsNavigation = resolveAuthFlowOwner() === "auth";

  const loadUser = React.useCallback(async (silent = false, retries = 2) => {
    try {
      if (!silent) setIsUserLoading(true);
      const response = await fetch("/api/account/init", { cache: "no-store" });

      if (!response.ok) throw new Error("Failed to load user.");

      const payload = (await response.json()) as
        | { user?: { name?: string; email?: string } }
        | undefined;

      if (!payload?.user) {
        cachedUser = null;
        setUser(null);
        return;
      }

      const userData: StudioUser = {
        name: payload.user.name?.trim() || fallbackUser.name,
        email: payload.user.email?.trim() || fallbackUser.email,
      };
      cachedUser = userData;
      setUser(userData);
      setDisplayName(userData.name);
    } catch {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return loadUser(true, retries - 1);
      }
      cachedUser = null;
      setUser(null);
    } finally {
      setIsUserLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (cachedUser === undefined) void loadUser();

    let unsubscribe: (() => void) | undefined;
    void import("@/lib/supabase/client")
      .then(({ createSupabaseBrowserClient: createClient }) => {
        const supabase = createClient();
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
          if (event === "SIGNED_OUT") {
            cachedUser = undefined;
            setUser(null);
            setIsUserLoading(false);
          } else if (event === "INITIAL_SESSION") {
            if (!cachedUser) void loadUser();
          } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            cachedUser = undefined;
            void loadUser();
            if (event === "SIGNED_IN") {
              void fetch("/api/account/mfa-cleanup", { method: "POST" });
            }
          }
        });
        unsubscribe = () => subscription.unsubscribe();
      })
      .catch(() => {
        cachedUser = null;
        setUser(null);
        setIsUserLoading(false);
      });

    return () => unsubscribe?.();
  }, [loadUser]);

  const handleSettings = React.useCallback(() => {
    if (authOwnsNavigation) {
      window.location.href = buildAuthAccountSecurityUrl({
        requestUrl: window.location.href,
      }).toString();
      return;
    }

    setIsSettingsOpen(true);
  }, [authOwnsNavigation]);

  const handleSignOut = React.useCallback(async () => {
    if (authOwnsNavigation) {
      window.location.href = buildAuthLogoutUrl({
        requestUrl: window.location.href,
      }).toString();
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await signOutSession(supabase);
      if (error) {
        toast.error(error.message);
        return;
      }
      cachedUser = undefined;
      window.location.href = `${window.location.pathname}?signed_out=true`;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to sign out.",
      );
    }
  }, [authOwnsNavigation]);

  if (isUserLoading) {
    return (
      <div
        className="flex h-9 items-center gap-2 px-1"
        aria-label="Loading user"
      >
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="hidden h-4 w-20 sm:block" />
      </div>
    );
  }

  if (!user) {
    return (
      <Button asChild variant="ghost" className="h-9 rounded-full px-3">
        <Link href="/welcome">
          <User className="size-4" />
          <span className="hidden sm:inline">Sign in</span>
        </Link>
      </Button>
    );
  }

  return (
    <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-10 max-w-52 gap-2 rounded-full px-2 sm:px-3"
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/55 text-xs font-semibold text-primary-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden truncate text-sm font-medium sm:block">
              {displayName}
            </span>
            <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-64 rounded-lg">
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-sm text-muted-foreground">
              {user.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              handleSettings();
            }}
          >
            <Settings className="size-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isSigningOut}
            onSelect={(event) => {
              event.preventDefault();
              startSigningOut(() => {
                void handleSignOut();
              });
            }}
          >
            <LogOut className="size-4" />
            <span className="text-destructive">
              {isSigningOut ? "Signing out..." : "Log out"}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {!authOwnsNavigation ? (
        <AccountSettingsSheet
          userName={displayName}
          onNameChange={(name) => {
            setDisplayName(name);
            cachedUser = { ...user, name };
          }}
          onClose={() => setIsSettingsOpen(false)}
          isOpen={isSettingsOpen}
        />
      ) : null}
    </Sheet>
  );
}
