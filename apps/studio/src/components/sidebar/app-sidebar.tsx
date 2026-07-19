"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { FileText, LayoutGrid } from "lucide-react";

import { APP_BRANDS } from "@repo/brand";
import {
  ApplicationBrandHeader,
  ApplicationSidebarCollapseButton,
  ApplicationSidebarExpandButton,
} from "@repo/ui/application-shell";
import { cn } from "@repo/ui/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@repo/ui/sidebar";

import { useActiveApp } from "@/hooks/use-active-app";
import { getSurfaceApps, type AppConfig } from "@/lib/config/hub-config";
import { NavApps } from "@/components/sidebar/nav-apps";

const TermsDialog = dynamic(
  () =>
    import("@/components/auth/terms-dialog").then((module) => ({
      default: module.TermsDialog,
    })),
  { ssr: false },
);

const DISCOVERY_IDS = [
  "studio-home",
  "studio-products",
  "tech-tools",
  "weather",
  "github-stats",
];
const WORKSPACE_IDS = [
  "activity-tracker",
  "currency-calculator",
  "file-manager",
  "messenger",
];
const EXPERIMENT_IDS = ["game-hub", "custom-calculator"];

function selectApps(apps: AppConfig[], ids: string[]) {
  return ids.flatMap((id) => {
    const app = apps.find((candidate) => candidate.id === id);
    return app ? [app] : [];
  });
}

type AppSidebarProps = Omit<React.ComponentProps<typeof Sidebar>, "children">;

export function AppSidebar({
  className,
  collapsible = "icon",
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();
  const apps = React.useMemo(
    () =>
      getSurfaceApps().map((app) => ({
        ...app,
        name: app.navLabel ?? app.name,
      })),
    [],
  );
  const discoveryApps = React.useMemo(
    () => selectApps(apps, DISCOVERY_IDS),
    [apps],
  );
  const workspaceApps = React.useMemo(
    () => selectApps(apps, WORKSPACE_IDS),
    [apps],
  );
  const experimentApps = React.useMemo(
    () => selectApps(apps, EXPERIMENT_IDS),
    [apps],
  );
  const { activeAppId, activeNavId } = useActiveApp(
    pathname,
    apps,
    "studio-home",
  );

  return (
    <Sidebar
      collapsible={collapsible}
      className={cn(
        "border-sidebar-border/80",
        "[&_[data-sidebar=group]]:px-2 [&_[data-sidebar=group]]:py-3",
        "[&_[data-sidebar=group-label]]:h-9 [&_[data-sidebar=group-label]]:font-[family-name:var(--font-ibm-plex-mono)] [&_[data-sidebar=group-label]]:text-[0.68rem] [&_[data-sidebar=group-label]]:font-medium [&_[data-sidebar=group-label]]:uppercase [&_[data-sidebar=group-label]]:tracking-[0.2em]",
        "[&_[data-sidebar=menu]]:gap-1.5",
        "[&_[data-sidebar=menu-button]]:rounded-lg",
        className,
      )}
      {...props}
    >
      <SidebarHeader className="p-2">
        <div className="flex items-center gap-1">
          <div className="group/application-brand relative min-w-0 flex-1">
            <ApplicationBrandHeader
              brand={{
                name: APP_BRANDS.studio.name,
                href: "/",
                icon: LayoutGrid,
              }}
            />
            <ApplicationSidebarExpandButton />
          </div>
          <ApplicationSidebarCollapseButton />
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <NavApps
          apps={discoveryApps}
          activeAppId={activeAppId}
          activeNavId={activeNavId}
          label="Discover"
        />
        <NavApps
          apps={workspaceApps}
          activeAppId={activeAppId}
          activeNavId={activeNavId}
          label="Workspaces"
        />
        <NavApps
          apps={experimentApps}
          activeAppId={activeAppId}
          activeNavId={activeNavId}
          label="Experiments"
        />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/80">
        <SidebarMenu>
          <SidebarMenuItem>
            <TermsDialog>
              <SidebarMenuButton
                type="button"
                tooltip="Terms & Conditions"
                className="w-full"
              >
                <FileText />
                <span>Terms & Conditions</span>
              </SidebarMenuButton>
            </TermsDialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
