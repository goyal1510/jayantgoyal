"use client";

import {
  ApplicationCommandPalette,
} from "@repo/ui/application-command-palette";

import { buildStudioSearchGroups } from "@/lib/config/studio-command-palette";

export function CommandPalette() {
  return (
    <ApplicationCommandPalette
      ariaLabel="Search Studio"
      title="Search Studio"
      description="Search Studio pages, products, tools, games, and workspaces"
      placeholder="Search Studio..."
      groups={buildStudioSearchGroups()}
    />
  );
}
