"use client";

import { usePathname } from "next/navigation";

import {
  BreadcrumbTrail,
  type BreadcrumbTrailItem,
} from "@repo/ui/application-shell";
import { getAdminNavigationContext } from "@/lib/config/nav-config";

export function DynamicBreadcrumb() {
  const pathname = usePathname();

  const context = getAdminNavigationContext(pathname);
  const items: BreadcrumbTrailItem[] = context
    ? [
        {
          id: "group",
          label: context.domain.label,
          href: context.pageLabel
            ? (context.domain.homeHref ?? undefined)
            : undefined,
        },
        ...(context.pageLabel
          ? [{ id: "page", label: context.pageLabel }]
          : []),
      ]
    : [];

  return <BreadcrumbTrail homeHref="/portfolio/hero" items={items} />;
}
