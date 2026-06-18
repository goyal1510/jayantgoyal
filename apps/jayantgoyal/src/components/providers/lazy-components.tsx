"use client";

import dynamic from "next/dynamic";

export const LazyCommandPalette = dynamic(
  () =>
    import("@/components/sidebar/command-palette").then((m) => ({
      default: m.CommandPalette,
    })),
  { ssr: false },
);
