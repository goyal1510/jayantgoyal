"use client";

import { useMemo } from "react";

import {
  ApplicationCommandPalette,
  type ApplicationCommandPaletteGroup,
} from "@jayant/web-ui/application-command-palette";

import {
  getVisibleAdminNavigationDomains,
  type AdminNavigationDomain,
} from "@/lib/config/nav-config";
import type { UserRole } from "@/lib/types";

export function AdminCommandPalette({ role }: { role: UserRole }) {
  const groups = useMemo<readonly ApplicationCommandPaletteGroup[]>(
    () =>
      getVisibleAdminNavigationDomains(role).map(
        (domain: AdminNavigationDomain) => ({
          id: domain.id,
          label: domain.label,
          items: domain.items.map((item) => ({
            id: item.href,
            label: item.label,
            value: `${domain.label} ${item.label} ${item.href}`,
            href: item.href,
            icon: item.icon,
          })),
        }),
      ),
    [role],
  );

  return (
    <ApplicationCommandPalette
      ariaLabel="Search Admin"
      title="Search Admin"
      description="Search portfolio workspaces and platform tools"
      placeholder="Search Admin workspaces…"
      emptyMessage="No Admin destination found."
      groups={groups}
    />
  );
}
