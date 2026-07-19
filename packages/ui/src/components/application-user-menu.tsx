"use client";

import * as React from "react";
import {
  ChevronRight,
  ChevronUp,
  FileText,
  LogOut,
  Mail,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback } from "./avatar";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { cn } from "../lib/utils";

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U"
  );
}

function DarkModeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark =
    theme === "dark" || (theme !== "light" && resolvedTheme === "dark")
      ? true
      : false;

  return (
    <div className="flex h-10 items-center gap-3 px-3 text-sm">
      {isDark ? (
        <Moon className="size-4 text-muted-foreground" aria-hidden="true" />
      ) : (
        <Sun className="size-4 text-muted-foreground" aria-hidden="true" />
      )}
      <span>Dark mode</span>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Dark mode"
        className={cn(
          "relative ml-auto inline-flex h-6 w-10 shrink-0 items-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
          isDark ? "bg-foreground" : "bg-muted-foreground/20",
        )}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        <span
          className={cn(
            "size-4 rounded-full bg-background shadow-sm transition-transform",
            isDark && "translate-x-4",
          )}
        />
      </button>
    </div>
  );
}

function UserMenuTrigger({
  user,
  inSidebar,
  className,
  ...props
}: {
  user: { name: string };
  inSidebar: boolean;
} & React.ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      variant="ghost"
      className={cn(
        "h-10 max-w-56 gap-2 rounded-full px-2 sm:px-3",
        inSidebar &&
          "h-12 w-full max-w-none justify-start gap-3 rounded-xl border border-sidebar-border/80 bg-transparent px-3 hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:p-0! data-[state=open]:border-sidebar-primary data-[state=open]:ring-2 data-[state=open]:ring-sidebar-primary/60 data-[state=open]:ring-offset-2 data-[state=open]:ring-offset-sidebar",
        className,
      )}
      aria-label={`${user.name} account menu`}
    >
      <Avatar
        className={cn(
          "size-8",
          inSidebar &&
            "rounded-md bg-sidebar-accent group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-md",
        )}
      >
        <AvatarFallback className="rounded-md bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground">
          {initials(user.name)}
        </AvatarFallback>
      </Avatar>
      <span
        className={cn(
          "hidden truncate text-sm font-medium sm:block",
          inSidebar &&
            "text-sm font-medium group-data-[collapsible=icon]:hidden",
        )}
      >
        {user.name}
      </span>
      <ChevronUp
        className={cn(
          "hidden size-4 text-muted-foreground sm:block",
          inSidebar && "ml-auto group-data-[collapsible=icon]:hidden",
        )}
      />
    </Button>
  );
}

function MenuSettingsItem({ onSettings }: { onSettings: () => void }) {
  return (
    <DropdownMenuItem
      className="h-10 rounded-none px-3 text-sm"
      onSelect={onSettings}
    >
      <Settings className="size-4 text-muted-foreground" />
      <span>Settings</span>
      <ChevronRight className="ml-auto size-4 text-muted-foreground" />
    </DropdownMenuItem>
  );
}

function MenuTermsItem({ termsHref }: { termsHref: string }) {
  return (
    <DropdownMenuItem asChild className="h-10 rounded-none px-3 text-sm">
      <a href={termsHref}>
        <FileText className="size-4 text-muted-foreground" />
        <span>Terms &amp; Conditions</span>
        <ChevronRight className="ml-auto size-4 text-muted-foreground" />
      </a>
    </DropdownMenuItem>
  );
}

function MenuSignOutItem({
  isSigningOut,
  onSignOut,
}: {
  isSigningOut: boolean;
  onSignOut: () => void | Promise<void>;
}) {
  return (
    <DropdownMenuItem
      className="h-10 rounded-none px-3 text-sm"
      disabled={isSigningOut}
      onSelect={(event) => {
        event.preventDefault();
        void onSignOut();
      }}
    >
      <LogOut className="size-4 text-muted-foreground" />
      <span>{isSigningOut ? "Signing out…" : "Sign out"}</span>
    </DropdownMenuItem>
  );
}

/** Shared account control; consuming apps route security and logout to Auth. */
export function ApplicationUserMenu({
  user,
  onSettings,
  termsHref,
  onSignOut,
  isSigningOut = false,
  inSidebar = false,
}: {
  user: { name: string; email: string };
  onSettings?: () => void;
  termsHref?: string;
  onSignOut: () => void | Promise<void>;
  isSigningOut?: boolean;
  inSidebar?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <UserMenuTrigger user={user} inSidebar={inSidebar} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={inSidebar ? "start" : "end"}
        side={inSidebar ? "top" : undefined}
        sideOffset={inSidebar ? 6 : 4}
        className={cn(
          "overflow-hidden rounded-lg p-0 shadow-lg",
          inSidebar
            ? "w-[var(--radix-dropdown-menu-trigger-width)] min-w-60"
            : "min-w-72",
        )}
      >
        <DropdownMenuLabel className="flex h-10 items-center gap-3 px-3 font-normal">
          <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="truncate text-sm text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />
        {onSettings ? <MenuSettingsItem onSettings={onSettings} /> : null}
        {termsHref ? <MenuTermsItem termsHref={termsHref} /> : null}
        <DarkModeToggle />
        <DropdownMenuSeparator className="my-0" />
        <MenuSignOutItem isSigningOut={isSigningOut} onSignOut={onSignOut} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
