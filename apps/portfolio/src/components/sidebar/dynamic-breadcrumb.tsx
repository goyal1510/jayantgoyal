"use client";

import { usePathname } from "next/navigation";

import { APP_BRANDS } from "@repo/brand";
import {
  BreadcrumbTrail,
  type BreadcrumbTrailItem,
} from "@repo/ui/application-shell";

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function DynamicBreadcrumb() {
  const pathname = usePathname();

  const items: BreadcrumbTrailItem[] = (() => {
    if (pathname === "/blog") {
      return [
        { id: "portfolio", label: APP_BRANDS.portfolio.name, href: "/" },
        { id: "blog", label: "Blog" },
      ];
    }

    if (pathname.startsWith("/blog/")) {
      const slug = pathname.split("/").filter(Boolean).at(-1) ?? "Article";
      return [
        { id: "blog", label: "Blog", href: "/blog" },
        { id: "article", label: titleFromSlug(slug) },
      ];
    }

    if (pathname.startsWith("/resume")) {
      return [
        { id: "portfolio", label: APP_BRANDS.portfolio.name, href: "/" },
        { id: "resume", label: "Resume" },
      ];
    }

    return [{ id: "portfolio", label: APP_BRANDS.portfolio.name }];
  })();

  return <BreadcrumbTrail homeHref="/" items={items} />;
}
