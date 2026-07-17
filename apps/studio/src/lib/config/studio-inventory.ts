import {
  Calculator,
  Cloud,
  FolderOpen,
  Gamepad2,
  Github,
  MessageSquare,
  ShoppingCart,
  Target,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const STUDIO_PRODUCT_TYPES = [
  "app",
  "game",
  "tool",
  "experiment",
] as const;

export type StudioProductType = (typeof STUDIO_PRODUCT_TYPES)[number];
export type StudioProductAccess = "public" | "account" | "external";
export type StudioProductStatus = "available" | "beta";

export type StudioProduct = {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  access: StudioProductAccess;
  type: StudioProductType;
  status: StudioProductStatus;
  capability: string;
  highlights: readonly string[];
  featured: boolean;
};

export const STUDIO_PRODUCTS: readonly StudioProduct[] = [
  {
    id: "tech-tools",
    name: "Tech Tools",
    description:
      "Generators, converters, formatters, parsers, validators, and everyday developer utilities.",
    href: "/tools",
    icon: Wrench,
    access: "public",
    type: "tool",
    status: "available",
    capability: "99+ utilities",
    highlights: [
      "Generators and converters",
      "Formatters and validators",
      "Text, network, media, and developer utilities",
    ],
    featured: true,
  },
  {
    id: "weather",
    name: "Weather",
    description:
      "Current conditions, location search, and a five-day forecast in one focused workspace.",
    href: "/weather",
    icon: Cloud,
    access: "public",
    type: "app",
    status: "available",
    capability: "Forecasting",
    highlights: [
      "City and location search",
      "Current conditions",
      "Five-day forecast",
    ],
    featured: false,
  },
  {
    id: "github-stats",
    name: "GitHub Stats",
    description:
      "Explore repository activity, language distribution, and coding statistics for any public profile.",
    href: "/github-stats",
    icon: Github,
    access: "public",
    type: "tool",
    status: "available",
    capability: "Developer insights",
    highlights: [
      "Public profile lookup",
      "Repository and language summaries",
      "Contribution-oriented insights",
    ],
    featured: false,
  },
  {
    id: "custom-calculator",
    name: "Custom Calculator",
    description:
      "Build reusable calculators by arranging inputs, operations, and outputs visually.",
    href: "/custom-calculator",
    icon: Calculator,
    access: "public",
    type: "tool",
    status: "beta",
    capability: "Visual builder",
    highlights: [
      "Composable inputs and operations",
      "Reusable calculator layouts",
      "Immediate result previews",
    ],
    featured: false,
  },
  {
    id: "game-hub",
    name: "Game Hub",
    description:
      "A collection of single-player and multiplayer games, including Chess, Wordle, and Connect Four.",
    href: "/games",
    icon: Gamepad2,
    access: "account",
    type: "game",
    status: "available",
    capability: "10 games",
    highlights: [
      "Single-player and multiplayer modes",
      "Room-based sessions",
      "Chess, Wordle, Connect Four, and more",
    ],
    featured: true,
  },
  {
    id: "activity-tracker",
    name: "Activity Tracker",
    description:
      "Record daily activities and review performance trends through personal dashboards.",
    href: "/activity-tracker/dashboard",
    icon: Target,
    access: "account",
    type: "app",
    status: "available",
    capability: "Personal analytics",
    highlights: [
      "Daily activity tracking",
      "Personal dashboards",
      "Completion and trend analysis",
    ],
    featured: true,
  },
  {
    id: "currency-calculator",
    name: "Currency Calculator",
    description:
      "Count cash denominations, save calculations by date, and keep a searchable history.",
    href: "/calculator/new",
    icon: Calculator,
    access: "account",
    type: "tool",
    status: "available",
    capability: "Saved calculations",
    highlights: [
      "Cash denomination totals",
      "Dated calculation history",
      "Saved notes and records",
    ],
    featured: false,
  },
  {
    id: "file-manager",
    name: "File Manager",
    description:
      "Organize private files and folders with cloud storage, upload, and recovery workflows.",
    href: "/files",
    icon: FolderOpen,
    access: "account",
    type: "app",
    status: "available",
    capability: "Private storage",
    highlights: [
      "Private file and folder organization",
      "Cloud upload and download",
      "Soft-delete and recovery workflows",
    ],
    featured: false,
  },
  {
    id: "messenger",
    name: "Messenger",
    description:
      "Send and receive real-time messages through a synchronized personal workspace.",
    href: "/messenger",
    icon: MessageSquare,
    access: "account",
    type: "app",
    status: "beta",
    capability: "Realtime",
    highlights: [
      "Realtime message delivery",
      "Text and code messages",
      "Account-backed conversation history",
    ],
    featured: false,
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description:
      "A separate storefront experiment with product browsing, cart, and transaction flows.",
    href: "https://ecommerce.jayantgoyal.com/",
    icon: ShoppingCart,
    access: "external",
    type: "experiment",
    status: "beta",
    capability: "Separate application",
    highlights: [
      "Product browsing",
      "Cart and checkout flows",
      "Independent deployment lifecycle",
    ],
    featured: false,
  },
];

export const FEATURED_STUDIO_PRODUCTS = STUDIO_PRODUCTS.filter(
  (product) => product.featured,
);

export function getStudioProduct(id: string): StudioProduct | undefined {
  return STUDIO_PRODUCTS.find((product) => product.id === id);
}

export function studioProductDetailHref(
  product: Pick<StudioProduct, "id">,
): string {
  return `/products/${product.id}`;
}
