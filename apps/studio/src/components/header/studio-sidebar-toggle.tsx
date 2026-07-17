"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Separator } from "@repo/ui/separator";
import { useSidebar } from "@repo/ui/sidebar";

export function SidebarHeaderCollapseButton() {
  const { isMobile, state, toggleSidebar } = useSidebar();

  if (isMobile || state === "collapsed") return null;

  return (
    <button
      type="button"
      className="m-0 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      onClick={toggleSidebar}
      aria-label="Collapse sidebar"
      title="Collapse sidebar"
    >
      <PanelLeftClose className="size-5" strokeWidth={1.8} />
    </button>
  );
}

export function SidebarCollapsedExpandButton() {
  const { isMobile, state, toggleSidebar } = useSidebar();

  if (isMobile || state === "expanded") return null;

  return (
    <button
      type="button"
      className="pointer-events-none absolute inset-0 z-10 m-0 inline-flex size-8 items-center justify-center rounded-lg border-0 bg-sidebar-primary p-0 text-sidebar-primary-foreground opacity-0 outline-none transition-opacity group-hover/studio-brand:pointer-events-auto group-hover/studio-brand:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      onClick={toggleSidebar}
      aria-label="Expand sidebar"
      title="Expand sidebar"
    >
      <PanelLeftOpen className="size-5" strokeWidth={2} />
    </button>
  );
}

export function TopbarSidebarControl() {
  const { isMobile, toggleSidebar } = useSidebar();

  if (!isMobile) return null;

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        className="m-0 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
        onClick={toggleSidebar}
        aria-label="Open sidebar"
        title="Open sidebar"
      >
        <PanelLeftOpen className="size-5" strokeWidth={2} />
      </button>
      <Separator orientation="vertical" className="h-4 shrink-0" />
    </div>
  );
}
