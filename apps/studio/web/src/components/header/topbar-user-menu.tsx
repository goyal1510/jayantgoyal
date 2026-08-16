"use client";

import * as React from "react";
import Link from "next/link";
import { User } from "lucide-react";

import {
  buildAuthAccountSecurityUrl,
  buildAuthLogoutUrl,
} from "@jayant/web-auth/entry";
import { ApplicationUserMenu } from "@jayant/web-ui/application-user-menu";
import { Button } from "@jayant/web-ui/button";
import { Skeleton } from "@jayant/web-ui/skeleton";

type StudioUser = { name: string; email: string; avatarUrl: string | null };

const fallbackUser: StudioUser = {
  name: "User",
  email: "user@example.com",
  avatarUrl: null,
};
let cachedUser: StudioUser | null | undefined;

export function TopbarUserMenu({ inSidebar = false }: { inSidebar?: boolean }) {
  const [user, setUser] = React.useState<StudioUser | null>(cachedUser ?? null);
  const [displayName, setDisplayName] = React.useState(
    cachedUser?.name ?? fallbackUser.name,
  );
  const [isUserLoading, setIsUserLoading] = React.useState(
    cachedUser === undefined,
  );
  const [isSigningOut, startSigningOut] = React.useTransition();

  const loadUser = React.useCallback(async (silent = false, retries = 2) => {
    try {
      if (!silent) setIsUserLoading(true);
      const response = await fetch("/api/account/init", { cache: "no-store" });

      if (!response.ok) throw new Error("Failed to load user.");

      const payload = (await response.json()) as
        | {
            user?: {
              name?: string;
              email?: string;
              avatarUrl?: string | null;
            };
          }
        | undefined;

      if (!payload?.user) {
        cachedUser = null;
        setUser(null);
        return;
      }

      const userData: StudioUser = {
        name: payload.user.name?.trim() || fallbackUser.name,
        email: payload.user.email?.trim() || fallbackUser.email,
        avatarUrl: payload.user.avatarUrl?.trim() || null,
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
    window.location.href = buildAuthAccountSecurityUrl({
      requestUrl: window.location.href,
    }).toString();
  }, []);

  const handleSignOut = React.useCallback(() => {
    window.location.href = buildAuthLogoutUrl({
      requestUrl: window.location.href,
    }).toString();
  }, []);

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
    <ApplicationUserMenu
      user={{ ...user, name: displayName }}
      inSidebar={inSidebar}
      termsHref="/terms-conditions"
      onSettings={handleSettings}
      onSignOut={() => {
        startSigningOut(handleSignOut);
      }}
      isSigningOut={isSigningOut}
    />
  );
}
