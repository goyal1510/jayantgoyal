"use client";

import { usePathname } from "next/navigation";

import {
  BreadcrumbTrail,
  type BreadcrumbTrailItem,
} from "@jayantgoyal/web-ui/application-shell";

import {
  buildOrbitBreadcrumbItems,
  type OrbitNavSnapshot,
} from "@/lib/config/orbit-nav-config";

type OrbitDynamicBreadcrumbProps = {
  snapshot: OrbitNavSnapshot;
};

export function OrbitDynamicBreadcrumb({ snapshot }: OrbitDynamicBreadcrumbProps) {
  const pathname = usePathname();
  const items: BreadcrumbTrailItem[] = buildOrbitBreadcrumbItems(pathname, snapshot);

  return <BreadcrumbTrail homeHref="/home" items={items} />;
}
