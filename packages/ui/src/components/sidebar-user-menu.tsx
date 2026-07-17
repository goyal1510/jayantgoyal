"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import { ChevronsUpDown, LogOut, Settings, User } from "lucide-react";

import { Avatar, AvatarFallback } from "./avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Sheet, SheetTrigger } from "./sheet";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./sidebar";

export interface SidebarUserSettingsRenderProps {
  open: boolean;
  close: () => void;
  displayName: string;
  setDisplayName: (name: string) => void;
}

export function SidebarUserMenu({
  user,
  onSignOut,
  renderSettings,
}: {
  user: { name: string; email: string };
  onSignOut: () => void | Promise<void>;
  renderSettings?: (props: SidebarUserSettingsRenderProps) => ReactNode;
}) {
  const { isMobile } = useSidebar();
  const [isSigningOut, startSigningOut] = useTransition();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user.name);

  useEffect(() => {
    setDisplayName(user.name?.trim() || "User");
  }, [user.name]);

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
              {renderSettings && (
                <>
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
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  startSigningOut(() => {
                    void onSignOut();
                  });
                }}
                disabled={isSigningOut}
                className="group/logout"
              >
                <LogOut className="transition-transform duration-200 group-hover/logout:translate-x-0.5" />
                <span className="text-destructive">
                  {isSigningOut ? "Signing out..." : "Log out"}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {renderSettings?.({
            open: isSettingsOpen,
            close: () => setIsSettingsOpen(false),
            displayName,
            setDisplayName,
          })}
        </Sheet>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
