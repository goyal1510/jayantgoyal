"use client";

import { ChevronDown, LogOut, Settings } from "lucide-react";

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

/** Shared account control; consuming apps route security and logout to Auth. */
export function ApplicationUserMenu({
  user,
  onSettings,
  onSignOut,
  isSigningOut = false,
}: {
  user: { name: string; email: string };
  onSettings?: () => void;
  onSignOut: () => void | Promise<void>;
  isSigningOut?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 max-w-56 gap-2 rounded-full px-2 sm:px-3"
          aria-label={`${user.name} account menu`}
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/55 text-xs font-semibold text-primary-foreground">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden truncate text-sm font-medium sm:block">
            {user.name}
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
        {onSettings ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSettings}>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void onSignOut();
          }}
        >
          <LogOut className="size-4" />
          <span className="text-destructive">
            {isSigningOut ? "Signing out…" : "Log out"}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
