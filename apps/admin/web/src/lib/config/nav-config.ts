import {
  Users,
  UserRound,
  Briefcase,
  FolderKanban,
  Github,
  Code2,
  Mail,
  LayoutDashboard,
  Rocket,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PORTFOLIO_WORKSPACE_ROUTES } from "@jayantgoyal/portfolio-contracts";
import type { UserRole } from "@/lib/types";
import { getCanonicalAdminPath } from "./portfolio-route-map";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface AdminNavigationDomain {
  id: "portfolio" | "studio" | "system";
  label: "Portfolio" | "Studio" | "Operations";
  homeHref: string | null;
  items: readonly NavItem[];
  roles: readonly UserRole[];
}

const portfolioNavItems: NavItem[] = [
  { label: "Overview", href: "/portfolio", icon: LayoutDashboard },
  { label: "Home", href: PORTFOLIO_WORKSPACE_ROUTES.home, icon: UserRound },
  { label: "About", href: PORTFOLIO_WORKSPACE_ROUTES.about, icon: UserRound },
  { label: "Skills", href: PORTFOLIO_WORKSPACE_ROUTES.skills, icon: Code2 },
  {
    label: "Experience",
    href: PORTFOLIO_WORKSPACE_ROUTES.experience,
    icon: Briefcase,
  },
  {
    label: "Activity",
    href: PORTFOLIO_WORKSPACE_ROUTES.activity,
    icon: Github,
  },
  { label: "Work", href: PORTFOLIO_WORKSPACE_ROUTES.work, icon: FolderKanban },
  {
    label: "Writing",
    href: PORTFOLIO_WORKSPACE_ROUTES.writing,
    icon: BookOpen,
  },
  { label: "Contact", href: PORTFOLIO_WORKSPACE_ROUTES.contact, icon: Mail },
];

const systemNavItems: NavItem[] = [
  { label: "Users", href: "/users", icon: Users },
];

const deploymentNavItems: NavItem[] = [
  { label: "Deployments", href: "/deployments", icon: Rocket },
];

export const adminNavigationDomains: readonly AdminNavigationDomain[] = [
  {
    id: "portfolio",
    label: "Portfolio",
    homeHref: "/portfolio",
    items: portfolioNavItems,
    roles: ["viewer", "full_access"],
  },
  {
    id: "studio",
    label: "Studio",
    homeHref: null,
    items: [],
    roles: ["full_access"],
  },
  {
    id: "system",
    label: "Operations",
    homeHref: "/users",
    items: [...systemNavItems, ...deploymentNavItems],
    roles: ["viewer", "full_access"],
  },
];

export function getVisibleAdminNavigationDomains(
  role: UserRole,
): readonly AdminNavigationDomain[] {
  return adminNavigationDomains.filter(
    (domain) => domain.roles.includes(role) && domain.items.length > 0,
  );
}

export function isAdminNavigationItemActive(
  pathname: string,
  item: NavItem,
): boolean {
  const canonicalPath = getCanonicalAdminPath(pathname);

  if (canonicalPath === item.href) return true;

  return (
    item.href === "/deployments" &&
    /^\/deployments\/[^/]+$/.test(pathname) &&
    pathname !== "/deployments/env"
  );
}

export interface AdminNavigationContext {
  domain: AdminNavigationDomain;
  pageLabel: string | null;
}

export function getAdminNavigationContext(
  pathname: string,
): AdminNavigationContext | null {
  const canonicalPath = getCanonicalAdminPath(pathname);

  for (const domain of adminNavigationDomains) {
    const item = domain.items.find(
      (candidate) => candidate.href === canonicalPath,
    );
    if (item) return { domain, pageLabel: item.label };
  }

  if (
    pathname !== "/deployments/env" &&
    /^\/deployments\/[^/]+$/.test(pathname)
  ) {
    const system = adminNavigationDomains.find(
      (domain) => domain.id === "system",
    );
    return system ? { domain: system, pageLabel: "Deployment Detail" } : null;
  }

  return null;
}
