import {
  Calculator,
  Cloud,
  FileText,
  FolderOpen,
  Gamepad2,
  Github,
  MessageSquare,
  ShoppingCart,
  Target,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type StudioProduct = {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  access: "public" | "account" | "external";
  capability: string;
};

export const STUDIO_PRODUCTS: StudioProduct[] = [
  {
    id: "tech-tools",
    name: "Tech Tools",
    description:
      "Generators, converters, formatters, parsers, validators, and everyday developer utilities.",
    href: "/tools",
    icon: Wrench,
    access: "public",
    capability: "99+ utilities",
  },
  {
    id: "weather",
    name: "Weather",
    description:
      "Current conditions, location search, and a five-day forecast in one focused workspace.",
    href: "/weather",
    icon: Cloud,
    access: "public",
    capability: "Forecasting",
  },
  {
    id: "github-stats",
    name: "GitHub Stats",
    description:
      "Explore repository activity, language distribution, and coding statistics for any public profile.",
    href: "/github-stats",
    icon: Github,
    access: "public",
    capability: "Developer insights",
  },
  {
    id: "custom-calculator",
    name: "Custom Calculator",
    description:
      "Build reusable calculators by arranging inputs, operations, and outputs visually.",
    href: "/custom-calculator",
    icon: Calculator,
    access: "public",
    capability: "Visual builder",
  },
  {
    id: "blog",
    name: "Blog",
    description:
      "Notes and practical write-ups about software engineering, products, and experiments.",
    href: "/blogs",
    icon: FileText,
    access: "public",
    capability: "Writing",
  },
  {
    id: "game-hub",
    name: "Game Hub",
    description:
      "A collection of single-player and multiplayer games, including Chess, Wordle, and Connect Four.",
    href: "/games",
    icon: Gamepad2,
    access: "account",
    capability: "10 games",
  },
  {
    id: "activity-tracker",
    name: "Activity Tracker",
    description:
      "Record daily activities and review performance trends through personal dashboards.",
    href: "/activity-tracker/dashboard",
    icon: Target,
    access: "account",
    capability: "Personal analytics",
  },
  {
    id: "currency-calculator",
    name: "Currency Calculator",
    description:
      "Count cash denominations, save calculations by date, and keep a searchable history.",
    href: "/calculator/new",
    icon: Calculator,
    access: "account",
    capability: "Saved calculations",
  },
  {
    id: "file-manager",
    name: "File Manager",
    description:
      "Organize private files and folders with cloud storage, upload, and recovery workflows.",
    href: "/files",
    icon: FolderOpen,
    access: "account",
    capability: "Private storage",
  },
  {
    id: "messenger",
    name: "Messenger",
    description:
      "Send and receive real-time messages through a synchronized personal workspace.",
    href: "/messenger",
    icon: MessageSquare,
    access: "account",
    capability: "Realtime",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description:
      "A separate storefront experiment with product browsing, cart, and transaction flows.",
    href: "https://ecommerce.jayantgoyal.com/",
    icon: ShoppingCart,
    access: "external",
    capability: "Separate application",
  },
];
