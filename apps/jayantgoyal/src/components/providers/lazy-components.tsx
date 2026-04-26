"use client"

import dynamic from "next/dynamic"

export const LazyThreeBgWrapper = dynamic(
  () => import("@/components/three/three-bg-wrapper").then((m) => ({ default: m.ThreeBgWrapper })),
  { ssr: false }
)

export const LazyCommandPalette = dynamic(
  () => import("@/components/sidebar/command-palette").then((m) => ({ default: m.CommandPalette })),
  { ssr: false }
)
