"use client";

import { usePathname } from "next/navigation";
import { Orbit as OrbitIcon } from "lucide-react";

import { APP_BRANDS } from "@jayantgoyal/web-brand";
import {
  ApplicationSidebarFrame,
  ApplicationSidebarSection,
} from "@jayantgoyal/web-ui/application-shell";

import { buildOrbitNavigationSections, type OrbitNavSnapshot } from "@/lib/config/orbit-nav-config";

import { OrbitTopbarUserMenu } from "./topbar-user-menu";

const orbitBrand = {
  name: APP_BRANDS.orbit.name,
  href: "/home",
  icon: OrbitIcon,
};

type OrbitAppSidebarProps = {
  snapshot: OrbitNavSnapshot;
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
};

export function OrbitAppSidebar({ snapshot, user }: OrbitAppSidebarProps) {
  const pathname = usePathname();
  const sections = buildOrbitNavigationSections(pathname, snapshot);

  return (
    <ApplicationSidebarFrame
      brand={orbitBrand}
      footerClassName="border-t border-sidebar-border/80 p-2"
      footerSeparator={false}
      footer={<OrbitTopbarUserMenu user={user} inSidebar />}
    >
      {sections.map((section) => (
        <ApplicationSidebarSection key={section.id} section={section} />
      ))}
    </ApplicationSidebarFrame>
  );
}
