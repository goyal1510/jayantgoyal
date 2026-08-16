"use client";

import * as React from "react";
import { PanelLeftIcon } from "lucide-react";

import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_WIDTH_COOKIE_NAME,
  clampSidebarWidth,
} from "../lib/sidebar-preferences";
import { cn } from "../lib/utils";
import { Button } from "./button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./sheet";
import { SIDEBAR_COOKIE_MAX_AGE, useSidebar } from "./sidebar-context";

const SIDEBAR_WIDTH_MOBILE = "18rem";

/** Renders the responsive sidebar shell for desktop and mobile clients. */
function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { isMobile, state, openMobile, setOpenMobile, isResizing } =
    useSidebar();

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile || openMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent",
          !isResizing && "transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) md:flex",
          !isResizing &&
            "transition-[left,right,width] duration-200 ease-linear",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

/** Supports click, keyboard, drag-resize, and double-click width reset. */
function SidebarRail({
  className,
  onKeyDown,
  ...props
}: React.ComponentProps<"button">) {
  const { toggleSidebar, state, setSidebarWidth, setIsResizing, isMobile } =
    useSidebar();
  const isCollapsed = state === "collapsed";

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleSidebar();
      }
    },
    [onKeyDown, toggleSidebar],
  );

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (isMobile || isCollapsed) return;

      e.preventDefault();
      const startX = e.clientX;
      let hasDragged = false;

      // Find the sidebar wrapper to determine side
      const rail = e.currentTarget as HTMLElement;
      const sidebarSlot = rail.closest("[data-side]");
      const side = sidebarSlot?.getAttribute("data-side") ?? "left";

      // Access context setter via closure
      const sidebarWrapper = rail.closest(
        "[data-slot='sidebar-wrapper']",
      ) as HTMLElement | null;

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      setIsResizing(true);

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (Math.abs(moveEvent.clientX - startX) > 3) {
          hasDragged = true;
        }
        if (!hasDragged) return;

        let newWidth: number;
        if (side === "left") {
          newWidth = moveEvent.clientX;
        } else {
          newWidth = window.innerWidth - moveEvent.clientX;
        }

        newWidth = clampSidebarWidth(newWidth);
        setSidebarWidth(newWidth);

        // Update CSS variable directly for smooth performance
        if (sidebarWrapper) {
          sidebarWrapper.style.setProperty("--sidebar-width", `${newWidth}px`);
        }
      };

      const onMouseUp = (upEvent: MouseEvent) => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setIsResizing(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);

        if (hasDragged) {
          // Persist width to cookie
          let finalWidth: number;
          if (side === "left") {
            finalWidth = upEvent.clientX;
          } else {
            finalWidth = window.innerWidth - upEvent.clientX;
          }
          finalWidth = clampSidebarWidth(finalWidth);
          setSidebarWidth(finalWidth);
          document.cookie = `${SIDEBAR_WIDTH_COOKIE_NAME}=${finalWidth}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        } else {
          // Click — toggle sidebar
          toggleSidebar();
        }
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [isMobile, isCollapsed, setSidebarWidth, setIsResizing, toggleSidebar],
  );

  const handleDoubleClick = React.useCallback(() => {
    if (isMobile || isCollapsed) return;
    setSidebarWidth(SIDEBAR_DEFAULT_WIDTH);
    document.cookie = `${SIDEBAR_WIDTH_COOKIE_NAME}=${SIDEBAR_DEFAULT_WIDTH}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
  }, [isMobile, isCollapsed, setSidebarWidth]);

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onClick={isCollapsed ? toggleSidebar : undefined}
      onKeyDown={handleKeyDown}
      title="Toggle Sidebar"
      className={cn(
        "hover:after:bg-sidebar-border focus-visible:ring-sidebar-ring absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
        isCollapsed ? "cursor-pointer" : "cursor-col-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  );
}

export { Sidebar, SidebarRail, SidebarTrigger };

export { SidebarProvider, useSidebar } from "./sidebar-context";
export {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarSeparator,
} from "./sidebar-layout";
export {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./sidebar-menu";
