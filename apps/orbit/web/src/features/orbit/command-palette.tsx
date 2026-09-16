"use client";

import { ApplicationCommandPalette } from "@jayantgoyal/web-ui/application-command-palette";

import {
  buildOrbitCommandPaletteGroups,
  type OrbitNavSnapshot,
} from "@/lib/config/orbit-nav-config";

type OrbitCommandPaletteProps = {
  snapshot: OrbitNavSnapshot;
};

export function OrbitCommandPalette({ snapshot }: OrbitCommandPaletteProps) {
  return (
    <ApplicationCommandPalette
      ariaLabel="Search Orbit"
      title="Search Orbit"
      description="Jump to boards, workspaces, settings, and integrations"
      placeholder="Search boards, workspaces, settings…"
      groups={buildOrbitCommandPaletteGroups(snapshot)}
    />
  );
}
