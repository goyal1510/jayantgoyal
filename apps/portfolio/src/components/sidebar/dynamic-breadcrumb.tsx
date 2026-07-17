"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

import { APP_BRANDS } from "@repo/brand";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/breadcrumb";

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function DynamicBreadcrumb() {
  const pathname = usePathname();

  const { appName, appHref, pageName } = (() => {
    if (pathname === "/blog") {
      return {
        appName: APP_BRANDS.portfolio.name,
        appHref: "/",
        pageName: "Blog",
      };
    }

    if (pathname.startsWith("/blog/")) {
      const slug = pathname.split("/").filter(Boolean).at(-1) ?? "Article";
      return {
        appName: "Blog",
        appHref: "/blog",
        pageName: titleFromSlug(slug),
      };
    }

    if (pathname.startsWith("/resume")) {
      return {
        appName: APP_BRANDS.portfolio.name,
        appHref: "/",
        pageName: "Resume",
      };
    }

    return {
      appName: APP_BRANDS.portfolio.name,
      appHref: "/",
      pageName: null,
    };
  })();

  return (
    <Breadcrumb className="min-w-0 flex-1 max-w-full">
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link
              href="/"
              aria-label="Home"
              className="flex items-center justify-center"
            >
              <Home className="size-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="shrink-0" />
        <BreadcrumbItem className="shrink-0 max-w-[200px]">
          {pageName ? (
            <BreadcrumbLink asChild>
              <Link href={appHref} className="truncate block">
                {appName}
              </Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="truncate block">
              {appName}
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {pageName && (
          <>
            <BreadcrumbSeparator className="shrink-0" />
            <BreadcrumbItem className="min-w-0 flex-1">
              <BreadcrumbPage className="block truncate">
                {pageName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
