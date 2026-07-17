"use client";

import { useMemo, type ComponentProps, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  BriefcaseBusiness,
  Code2,
  FileText,
  LayoutGrid,
} from "lucide-react";

import { APP_BRANDS } from "@repo/brand";
import { applicationOrigin } from "@repo/platform";
import {
  ApplicationSidebarFrame,
  ApplicationSidebarMenu,
  ApplicationSidebarSection,
  type ApplicationNavigationSection,
} from "@repo/ui/application-shell";

import { useScrollTracking } from "@/hooks/use-scroll-tracking";
import { getIconComponentWithFallback } from "@/lib/portfolio/icons";
import { usePortfolioData } from "@/lib/portfolio/use-portfolio-data";

const STUDIO_URL = applicationOrigin(
  "studio",
  process.env.NEXT_PUBLIC_STUDIO_URL,
);

type PortfolioSidebarProps = Omit<
  ComponentProps<typeof ApplicationSidebarFrame>,
  "brand" | "children" | "footer"
>;

export function PortfolioSidebar(props: PortfolioSidebarProps) {
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

  const portfolioSection: ApplicationNavigationSection = {
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
  };
  const moreSection: ApplicationNavigationSection = {
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
  };

  return (
    <ApplicationSidebarFrame
      brand={{
        name: APP_BRANDS.portfolio.name,
        href: "/",
        icon: BriefcaseBusiness,
      }}
      footer={
        <ApplicationSidebarMenu
          items={[
            {
              id: "studio",
              label: APP_BRANDS.studio.name,
              href: STUDIO_URL,
              icon: LayoutGrid,
              iconClassName: "text-cyan-500",
              external: true,
            },
          ]}
        />
      }
      {...props}
    >
      <ApplicationSidebarSection section={portfolioSection} />
      <ApplicationSidebarSection section={moreSection} />
    </ApplicationSidebarFrame>
  );
}
