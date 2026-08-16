"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";

import { APP_BRANDS } from "@jayantgoyal/web-brand";
import { ApplicationSidebarFrame } from "@jayantgoyal/web-ui/application-shell";
import { cn } from "@jayantgoyal/web-ui/lib/utils";

import { useActiveApp } from "@/hooks/use-active-app";
import { getSurfaceApps, type AppConfig } from "@/lib/config/hub-config";
import { NavApps } from "@/components/sidebar/nav-apps";
import { TopbarUserMenu } from "@/components/header/topbar-user-menu";

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
  "scratchpad",
];
const EXPERIMENT_IDS = ["game-hub", "custom-calculator"];

function selectApps(apps: AppConfig[], ids: string[]) {
  return ids.flatMap((id) => {
    const app = apps.find((candidate) => candidate.id === id);
    return app ? [app] : [];
  });
}

type AppSidebarProps = Omit<
  React.ComponentProps<typeof ApplicationSidebarFrame>,
  "brand" | "children" | "footer"
>;

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
    <ApplicationSidebarFrame
      brand={{
        name: APP_BRANDS.studio.name,
        href: "/",
        icon: LayoutGrid,
      }}
      collapsible={collapsible}
      className={cn(
        "border-sidebar-border/80",
        "[&_[data-sidebar=group]]:px-2 [&_[data-sidebar=group]]:py-3",
        "[&_[data-sidebar=group-label]]:h-9 [&_[data-sidebar=group-label]]:font-[family-name:var(--font-ibm-plex-mono)] [&_[data-sidebar=group-label]]:text-[0.68rem] [&_[data-sidebar=group-label]]:font-medium [&_[data-sidebar=group-label]]:uppercase [&_[data-sidebar=group-label]]:tracking-[0.2em]",
        "[&_[data-sidebar=menu]]:gap-1.5",
        "[&_[data-sidebar=menu-button]]:rounded-lg",
        className,
      )}
      contentClassName="gap-0"
      footerClassName="border-t border-sidebar-border/80"
      footerSeparator={false}
      footer={<TopbarUserMenu inSidebar />}
      {...props}
    >
      <>
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
      </>
    </ApplicationSidebarFrame>
  );
}
