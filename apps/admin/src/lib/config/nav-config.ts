import {
  Users,
  User,
  Briefcase,
  FolderGit2,
  Award,
  Code2,
  GraduationCap,
  Mail,
  Navigation,
  MonitorSmartphone,
  Palette,
  Rocket,
  FileText,
  FilePenLine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { UserRole } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface AdminNavigationDomain {
  id: "portfolio" | "studio" | "system";
  label: "Portfolio" | "Studio" | "System";
  homeHref: string | null;
  items: readonly NavItem[];
  roles: readonly UserRole[];
}

export const portfolioNavItems: NavItem[] = [
  { label: "Hero", href: "/portfolio/hero", icon: MonitorSmartphone },
  { label: "Section Copy", href: "/portfolio/section-copy", icon: FilePenLine },
  { label: "About", href: "/portfolio/about", icon: User },
  { label: "Education", href: "/portfolio/education", icon: GraduationCap },
  { label: "Experience", href: "/portfolio/experience", icon: Briefcase },
  { label: "Skills", href: "/portfolio/skills", icon: Code2 },
  { label: "Tech Icons", href: "/portfolio/tech-icons", icon: Palette },
  { label: "Projects", href: "/portfolio/projects", icon: FolderGit2 },
  { label: "Certificates", href: "/portfolio/certificates", icon: Award },
  { label: "Contact", href: "/portfolio/contact", icon: Mail },
  { label: "Navigation", href: "/portfolio/navigation", icon: Navigation },
];

export const blogNavItems: NavItem[] = [
  { label: "Blog", href: "/blog", icon: FileText },
];

export const systemNavItems: NavItem[] = [
  { label: "Users", href: "/users", icon: Users },
];

export const deploymentNavItems: NavItem[] = [
  { label: "Deployments", href: "/deployments", icon: Rocket },
];

export const adminNavigationDomains: readonly AdminNavigationDomain[] = [
  {
    id: "portfolio",
    label: "Portfolio",
    homeHref: "/portfolio/hero",
    items: [...portfolioNavItems, ...blogNavItems],
    roles: ["admin", "super_admin"],
  },
  {
    id: "studio",
    label: "Studio",
    homeHref: null,
    items: [],
    roles: ["super_admin"],
  },
  {
    id: "system",
    label: "System",
    homeHref: "/users",
    items: [...systemNavItems, ...deploymentNavItems],
    roles: ["super_admin"],
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
  if (pathname === item.href) return true;

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
  for (const domain of adminNavigationDomains) {
    const item = domain.items.find((candidate) => candidate.href === pathname);
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
