"use client";

import { useMemo, type ComponentProps, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  BriefcaseBusiness,
  Code2,
  FileText,
  LayoutGrid,
} from "lucide-react";

import { APP_BRANDS } from "@repo/brand";
import { Separator } from "@repo/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@repo/ui/sidebar";

import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import { useScrollTracking } from "@/hooks/use-scroll-tracking";
import { getIconComponentWithFallback } from "@/lib/portfolio/icons";
import { usePortfolioData } from "@/lib/portfolio/use-portfolio-data";

const STUDIO_URL =
  process.env.NEXT_PUBLIC_STUDIO_URL ?? APP_BRANDS.studio.canonicalUrl;

export function PortfolioSidebar(props: ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data } = usePortfolioData();
  const { isMobile, setOpenMobile } = useSidebar();
  const sectionIds = useMemo(
    () => data.NAV_ITEMS.map((item) => item.id),
    [data.NAV_ITEMS],
  );
  const activeSection = useScrollTracking(sectionIds, pathname === "/");

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleSectionNavigation = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    closeMobileSidebar();
    if (pathname !== "/") return;

    const section = document.getElementById(sectionId);
    if (!section) return;

    event.preventDefault();
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `/#${sectionId}`);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          brand={{
            name: APP_BRANDS.portfolio.name,
            logo: BriefcaseBusiness,
          }}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Portfolio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.NAV_ITEMS.map((item) => {
                const Icon = getIconComponentWithFallback(item.icon_key, Code2);

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/" && activeSection === item.id}
                      tooltip={item.label}
                    >
                      <Link
                        href={`/#${item.id}`}
                        onClick={(event) =>
                          handleSectionNavigation(event, item.id)
                        }
                      >
                        <Icon className={item.color} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>More</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/blog")}
                  tooltip="Blog"
                >
                  <Link href="/blog" onClick={closeMobileSidebar}>
                    <BookOpenText className="text-violet-500" />
                    <span>Blog</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/resume")}
                  tooltip="Resume"
                >
                  <Link href="/resume" onClick={closeMobileSidebar}>
                    <FileText className="text-blue-500" />
                    <span>Resume</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <Separator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={APP_BRANDS.studio.name}>
              <a href={STUDIO_URL} onClick={closeMobileSidebar}>
                <LayoutGrid className="text-cyan-500" />
                <span>{APP_BRANDS.studio.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
