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
  KeyRound,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export const portfolioNavItems: NavItem[] = [
  { label: "Hero", href: "/portfolio/hero", icon: MonitorSmartphone },
  { label: "About", href: "/portfolio/about", icon: User },
  { label: "Education", href: "/portfolio/education", icon: GraduationCap },
  { label: "Experience", href: "/portfolio/experience", icon: Briefcase },
  { label: "Skills", href: "/portfolio/skills", icon: Code2 },
  { label: "Tech Icons", href: "/portfolio/tech-icons", icon: Palette },
  { label: "Projects", href: "/portfolio/projects", icon: FolderGit2 },
  { label: "Certificates", href: "/portfolio/certificates", icon: Award },
  { label: "Contact", href: "/portfolio/contact", icon: Mail },
  { label: "Navigation", href: "/portfolio/navigation", icon: Navigation },
]

export const adminNavItems: NavItem[] = [
  { label: "User Management", href: "/users", icon: Users },
]

export const deploymentNavItems: NavItem[] = [
  { label: "Deployments", href: "/deployments", icon: Rocket },
  { label: "Env Variables", href: "/deployments/env", icon: KeyRound },
]
