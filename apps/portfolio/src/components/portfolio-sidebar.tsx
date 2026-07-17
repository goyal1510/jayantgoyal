"use client";

import { useMemo, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  BriefcaseBusiness,
  Code2,
  FileText,
  LayoutGrid,
} from "lucide-react";

import { APP_BRANDS } from "@repo/brand";
import {
  AppSidebarShell,
  type AppSidebarNavGroupConfig,
  type AppSidebarNavItem,
} from "@repo/ui/app-sidebar-shell";

import { useScrollTracking } from "@/hooks/use-scroll-tracking";
import { getIconComponentWithFallback } from "@/lib/portfolio/icons";
import { usePortfolioData } from "@/lib/portfolio/use-portfolio-data";

const STUDIO_URL =
  process.env.NEXT_PUBLIC_STUDIO_URL ?? APP_BRANDS.studio.canonicalUrl;

export function PortfolioSidebar() {
  const pathname = usePathname();
  const { data } = usePortfolioData();
  const sectionIds = useMemo(
    () => data.NAV_ITEMS.map((item) => item.id),
    [data.NAV_ITEMS],
  );
  const activeSection = useScrollTracking(sectionIds, pathname === "/");

  const handleSectionNavigation = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    if (pathname !== "/") return;

    const section = document.getElementById(sectionId);
    if (!section) return;

    event.preventDefault();
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `/#${sectionId}`);
  };

  const groups: AppSidebarNavGroupConfig[] = [
    {
      id: "portfolio",
      label: "Portfolio",
      items: data.NAV_ITEMS.map((item) => ({
        id: item.id,
        label: item.label,
        href: `/#${item.id}`,
        icon: getIconComponentWithFallback(item.icon_key, Code2),
        iconClassName: item.color,
        isActive: pathname === "/" && activeSection === item.id,
        onSelect: (event) => handleSectionNavigation(event, item.id),
      })),
    },
    {
      id: "more",
      label: "More",
      items: [
        {
          id: "blog",
          label: "Blog",
          href: "/blog",
          icon: BookOpenText,
          iconClassName: "text-violet-500",
          isActive: pathname.startsWith("/blog"),
        },
        {
          id: "resume",
          label: "Resume",
          href: "/resume",
          icon: FileText,
          iconClassName: "text-blue-500",
          isActive: pathname.startsWith("/resume"),
        },
      ],
    },
  ];

  const footerItems: AppSidebarNavItem[] = [
    {
      id: "studio",
      label: APP_BRANDS.studio.name,
      href: STUDIO_URL,
      icon: LayoutGrid,
      iconClassName: "text-cyan-500",
      external: true,
    },
  ];

  return (
    <AppSidebarShell
      brand={{
        name: APP_BRANDS.portfolio.name,
        href: "/",
        icon: BriefcaseBusiness,
      }}
      groups={groups}
      footerItems={footerItems}
    />
  );
}
