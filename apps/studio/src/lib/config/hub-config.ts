import {
  Home,
  User,
  BrainCog,
  BriefcaseBusiness,
  Code2,
  Award,
  Mail,
  Dices,
  Grid3X3,
  Swords,
  Circle,
  Brain,
  LayoutDashboard,
  Target,
  Settings,
  Plus,
  History,
  Type,
  Puzzle,
  Crown,
  Dice5,
  type LucideIcon,
} from "lucide-react";

import {
  getStudioSurface,
  type StudioSurfaceId,
} from "@/lib/config/studio-surfaces";
import type {
  ApplicationNavigationItem,
} from "@repo/ui/application-shell";

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  url?: string;
};

export type AppConfig = {
  id: string;
  name: string;
  navLabel?: string;
  icon: LucideIcon;
  color: string;
  isPublic: boolean;
  navItems: NavItem[];
  url?: string;
  externalUrl?: string;
};

/**
 * App-owned bridge into the shared navigation presentation contract.
 *
 * Studio keeps its richer NavApps/TechTools renderers for now, but deriving
 * this tree here means the shared shell can consume Studio's active product
 * and nested destinations without learning Studio route or permission rules.
 */
export function toApplicationNavigationItem(
  app: AppConfig,
  activeAppId?: string,
  activeNavId?: string,
): ApplicationNavigationItem {
  const isActive = activeAppId === app.id;

  return {
    id: app.id,
    label: app.name,
    href: app.externalUrl ?? app.url ?? `/${app.id}`,
    icon: app.icon,
    iconClassName: app.color,
    external: Boolean(app.externalUrl),
    isActive,
    defaultOpen: isActive,
    children: app.navItems.length
      ? app.navItems.map((item) => ({
          id: item.id,
          label: item.label,
          href: item.url ?? `/${app.id}/${item.id}`,
          icon: item.icon,
          iconClassName: item.color,
          isActive: isActive && activeNavId === item.id,
        }))
      : undefined,
  };
}

function createSurfaceApp(
  id: StudioSurfaceId,
  navItems: NavItem[] = [],
): AppConfig {
  const surface = getStudioSurface(id);

  return {
    id: surface.id,
    name: surface.name,
    navLabel: surface.navLabel,
    icon: surface.icon,
    color: surface.color,
    isPublic: surface.isPublic,
    navItems,
    ...(surface.external
      ? { externalUrl: surface.href }
      : { url: surface.href }),
  };
}

// Portfolio navigation items (scroll-based sections)
const PORTFOLIO_NAV: NavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    color: "text-sky-600 dark:text-sky-400",
    url: "/#home",
  },
  {
    id: "about",
    label: "About",
    icon: User,
    color: "text-emerald-600 dark:text-emerald-400",
    url: "/about",
  },
  {
    id: "skills",
    label: "Skills",
    icon: BrainCog,
    color: "text-amber-500 dark:text-amber-400",
    url: "/#skills",
  },
  {
    id: "experience",
    label: "Experience",
    icon: BriefcaseBusiness,
    color: "text-indigo-500 dark:text-indigo-400",
    url: "/#experience",
  },
  {
    id: "work",
    label: "Work",
    icon: Code2,
    color: "text-rose-500 dark:text-rose-400",
    url: "/#studio",
  },
  {
    id: "certificates",
    label: "Certificates",
    icon: Award,
    color: "text-cyan-600 dark:text-cyan-400",
    url: "/#certificates",
  },
  {
    id: "contact",
    label: "Contact",
    icon: Mail,
    color: "text-lime-600 dark:text-lime-400",
    url: "/#contact",
  },
];

// Game Hub navigation items
const GAME_HUB_NAV: NavItem[] = [
  {
    id: "dashboard",
    label: "All Games",
    icon: LayoutDashboard,
    color: "text-blue-500 dark:text-blue-400",
    url: "/games",
  },
  {
    id: "rock-paper-scissors",
    label: "Rock Paper Scissors",
    icon: Dices,
    color: "text-purple-500 dark:text-purple-400",
    url: "/games/rock-paper-scissors",
  },
  {
    id: "tic-tac-toe",
    label: "Tic Tac Toe",
    icon: Grid3X3,
    color: "text-green-500 dark:text-green-400",
    url: "/games/tic-tac-toe",
  },
  {
    id: "dare-x",
    label: "Dare X",
    icon: Swords,
    color: "text-red-500 dark:text-red-400",
    url: "/games/dare-x",
  },
  {
    id: "connect-four",
    label: "Connect Four",
    icon: Circle,
    color: "text-yellow-500 dark:text-yellow-400",
    url: "/games/connect-four",
  },
  {
    id: "memory-match",
    label: "Memory Match",
    icon: Brain,
    color: "text-pink-500 dark:text-pink-400",
    url: "/games/memory-match",
  },
  {
    id: "wordle",
    label: "Wordle",
    icon: Puzzle,
    color: "text-emerald-500 dark:text-emerald-400",
    url: "/games/wordle",
  },
  {
    id: "typing-speed",
    label: "Typing Speed",
    icon: Type,
    color: "text-cyan-500 dark:text-cyan-400",
    url: "/games/typing-speed",
  },
  {
    id: "chess",
    label: "Chess",
    icon: Crown,
    color: "text-stone-600 dark:text-stone-300",
    url: "/games/chess",
  },
  {
    id: "ludo",
    label: "Ludo",
    icon: Dice5,
    color: "text-rose-500 dark:text-rose-400",
    url: "/games/ludo",
  },
];

// Tech Tools - uses nested navigation from lib/tools/tools.ts
// This is just a placeholder, actual navigation is rendered from toolCategories

// Activity Tracker navigation items
const ACTIVITY_TRACKER_NAV: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "text-blue-500 dark:text-blue-400",
    url: "/activity-tracker/dashboard",
  },
  {
    id: "tracker",
    label: "Tracker",
    icon: Target,
    color: "text-green-500 dark:text-green-400",
    url: "/activity-tracker/tracker",
  },
  {
    id: "management",
    label: "Management",
    icon: Settings,
    color: "text-gray-500 dark:text-gray-400",
    url: "/activity-tracker/management",
  },
];

// Currency Calculator navigation items
const CURRENCY_CALC_NAV: NavItem[] = [
  {
    id: "new",
    label: "New",
    icon: Plus,
    color: "text-green-500 dark:text-green-400",
    url: "/calculator/new",
  },
  {
    id: "history",
    label: "History",
    icon: History,
    color: "text-blue-500 dark:text-blue-400",
    url: "/calculator/history",
  },
];

// All apps configuration
// Ordered: private apps first (dropdowns → direct links), then public apps (dropdowns → direct links)
export const HUB_APPS: AppConfig[] = [
  // --- Private apps (dropdowns first) ---
  createSurfaceApp("game-hub", GAME_HUB_NAV),
  createSurfaceApp("activity-tracker", ACTIVITY_TRACKER_NAV),
  createSurfaceApp("currency-calculator", CURRENCY_CALC_NAV),
  createSurfaceApp("file-manager"),
    createSurfaceApp("scratchpad"),
  // --- Public apps (dropdowns first) ---
  createSurfaceApp("portfolio", PORTFOLIO_NAV),
  createSurfaceApp("tech-tools"),
    createSurfaceApp("writing"),
  createSurfaceApp("weather"),
  createSurfaceApp("custom-calculator"),
  createSurfaceApp("github-stats"),
  createSurfaceApp("ecommerce"),
];

const STUDIO_HOME_APP = createSurfaceApp("studio-home");
const STUDIO_PRODUCTS_APP = createSurfaceApp("studio-products");
const PORTFOLIO_EXTERNAL_APP = createSurfaceApp("portfolio");
const PORTFOLIO_WRITING_EXTERNAL_APP = createSurfaceApp("writing");

export function getSurfaceApps(): AppConfig[] {
  return [
    STUDIO_HOME_APP,
    STUDIO_PRODUCTS_APP,
    ...HUB_APPS.filter((app) => app.id !== "portfolio" && app.id !== "writing"),
    PORTFOLIO_WRITING_EXTERNAL_APP,
    PORTFOLIO_EXTERNAL_APP,
  ];
}

// Get private apps
export const getPrivateApps = () => HUB_APPS.filter((app) => !app.isPublic);

// Get public apps
export const getPublicApps = () => HUB_APPS.filter((app) => app.isPublic);

// Get app by ID
export const getAppById = (id: string) => HUB_APPS.find((app) => app.id === id);
