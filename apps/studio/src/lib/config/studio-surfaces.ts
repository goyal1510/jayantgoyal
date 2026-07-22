import {
  Boxes,
  Calculator,
  Clapperboard,
  Cloud,
  FileText,
  FolderOpen,
  Gamepad2,
  Github,
  LayoutGrid,
  MessageSquare,
  ShoppingCart,
  Target,
  User,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { PORTFOLIO_URL, portfolioUrl } from "@/lib/platform/urls";

export type StudioSurfaceSection =
  | "discover"
  | "utility"
  | "workspace"
  | "experiment"
  | "external"
  | "catalog";

type StudioSurfaceDefinition = {
  id: string;
  name: string;
  navLabel: string;
  href: string;
  icon: LucideIcon;
  color: string;
  section: StudioSurfaceSection;
  isPublic: boolean;
  external: boolean;
  searchKeywords: readonly string[];
};

export const STUDIO_SURFACES = {
  "studio-home": {
    id: "studio-home",
    name: "Studio",
    navLabel: "Home",
    href: "/",
    icon: LayoutGrid,
    color: "text-blue-600 dark:text-blue-400",
    section: "discover",
    isPublic: true,
    external: false,
    searchKeywords: ["home", "studio"],
  },
  "studio-products": {
    id: "studio-products",
    name: "Products",
    navLabel: "Products",
    href: "/products",
    icon: Boxes,
    color: "text-violet-500 dark:text-violet-400",
    section: "discover",
    isPublic: true,
    external: false,
    searchKeywords: ["products", "catalog", "apps"],
  },
  "tech-tools": {
    id: "tech-tools",
    name: "Tech Tools",
    navLabel: "Tech Tools",
    href: "/tools",
    icon: Wrench,
    color: "text-orange-500 dark:text-orange-400",
    section: "discover",
    isPublic: true,
    external: false,
    searchKeywords: ["tools", "utilities", "developer tools"],
  },
  "media-lab": {
    id: "media-lab",
    name: "Media Lab",
    navLabel: "Media Lab",
    href: "/media-lab/youtube-converter",
    icon: Clapperboard,
    color: "text-rose-500 dark:text-rose-400",
    section: "utility",
    isPublic: false,
    external: false,
    searchKeywords: ["media", "youtube", "audio", "video", "converter"],
  },
  weather: {
    id: "weather",
    name: "Weather",
    navLabel: "Weather",
    href: "/weather",
    icon: Cloud,
    color: "text-sky-500 dark:text-sky-400",
    section: "discover",
    isPublic: true,
    external: false,
    searchKeywords: ["weather", "forecast"],
  },
  "github-stats": {
    id: "github-stats",
    name: "GitHub Stats",
    navLabel: "GitHub Stats",
    href: "/github-stats",
    icon: Github,
    color: "text-gray-700 dark:text-gray-300",
    section: "discover",
    isPublic: true,
    external: false,
    searchKeywords: ["github", "repository", "developer stats"],
  },
  "activity-tracker": {
    id: "activity-tracker",
    name: "Activity Tracker",
    navLabel: "Activity Tracker",
    href: "/activity-tracker/dashboard",
    icon: Target,
    color: "text-green-500 dark:text-green-400",
    section: "workspace",
    isPublic: false,
    external: false,
    searchKeywords: ["activity", "tracker", "dashboard"],
  },
  "currency-calculator": {
    id: "currency-calculator",
    name: "Currency Calculator",
    navLabel: "Currency Calculator",
    href: "/calculator/new",
    icon: Calculator,
    color: "text-amber-500 dark:text-amber-400",
    section: "catalog",
    isPublic: false,
    external: false,
    searchKeywords: ["currency", "cash", "calculator"],
  },
  "file-manager": {
    id: "file-manager",
    name: "File Manager",
    navLabel: "File Manager",
    href: "/files",
    icon: FolderOpen,
    color: "text-blue-500 dark:text-blue-400",
    section: "workspace",
    isPublic: false,
    external: false,
    searchKeywords: ["files", "folders", "storage"],
  },
  messenger: {
    id: "messenger",
    name: "Messenger",
    navLabel: "Messenger",
    href: "/messenger",
    icon: MessageSquare,
    color: "text-blue-500 dark:text-blue-400",
    section: "workspace",
    isPublic: false,
    external: false,
    searchKeywords: ["messenger", "messages", "chat"],
  },
  "game-hub": {
    id: "game-hub",
    name: "Game Hub",
    navLabel: "Game Hub",
    href: "/games",
    icon: Gamepad2,
    color: "text-purple-500 dark:text-purple-400",
    section: "experiment",
    isPublic: false,
    external: false,
    searchKeywords: ["games", "game hub", "play"],
  },
  "custom-calculator": {
    id: "custom-calculator",
    name: "Calculator Builder",
    navLabel: "Calculator Builder",
    href: "/custom-calculator",
    icon: Calculator,
    color: "text-violet-500 dark:text-violet-400",
    section: "experiment",
    isPublic: true,
    external: false,
    searchKeywords: ["custom calculator", "calculator builder"],
  },
  ecommerce: {
    id: "ecommerce",
    name: "E-commerce",
    navLabel: "E-commerce",
    href: "https://ecommerce.jayantgoyal.com/",
    icon: ShoppingCart,
    color: "text-pink-500 dark:text-pink-400",
    section: "catalog",
    isPublic: true,
    external: true,
    searchKeywords: ["ecommerce", "store", "shop"],
  },
  blog: {
    id: "blog",
    name: "Blog",
    navLabel: "Blog",
    href: portfolioUrl("/blog"),
    icon: FileText,
    color: "text-orange-500 dark:text-orange-400",
    section: "external",
    isPublic: true,
    external: true,
    searchKeywords: ["blog", "writing", "articles"],
  },
  portfolio: {
    id: "portfolio",
    name: "Portfolio",
    navLabel: "Portfolio",
    href: PORTFOLIO_URL,
    icon: User,
    color: "text-emerald-500 dark:text-emerald-400",
    section: "external",
    isPublic: true,
    external: true,
    searchKeywords: ["portfolio", "jayant goyal", "work"],
  },
} as const satisfies Record<string, StudioSurfaceDefinition>;

export type StudioSurfaceId = keyof typeof STUDIO_SURFACES;

export function getStudioSurface(id: StudioSurfaceId) {
  return STUDIO_SURFACES[id];
}
