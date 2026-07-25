import type { LucideIcon } from "lucide-react";

import { STUDIO_SURFACES } from "@/lib/config/studio-surfaces";
import { GAME_META } from "@/lib/games/config";
import { allTools } from "@/lib/tools/tools";

export const STUDIO_PRODUCT_TYPES = [
  "app",
  "game",
  "tool",
  "experiment",
] as const;

export type StudioProductType = (typeof STUDIO_PRODUCT_TYPES)[number];
type StudioProductAccess = "public" | "account" | "external";
type StudioProductStatus = "available" | "beta";

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
    name: STUDIO_SURFACES["tech-tools"].name,
    description:
      "Generators, converters, formatters, parsers, validators, and everyday developer utilities.",
    href: STUDIO_SURFACES["tech-tools"].href,
    icon: STUDIO_SURFACES["tech-tools"].icon,
    access: "public",
    type: "tool",
    status: "available",
    capability: `${allTools.length} utilities`,
    highlights: [
      "Generators and converters",
      "Formatters and validators",
      "Text, network, media, and developer utilities",
    ],
    featured: true,
  },
  {
    id: "weather",
    name: STUDIO_SURFACES.weather.name,
    description:
      "Current conditions, location search, and a five-day forecast in one focused workspace.",
    href: STUDIO_SURFACES.weather.href,
    icon: STUDIO_SURFACES.weather.icon,
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
    name: STUDIO_SURFACES["github-stats"].name,
    description:
      "Explore repository activity, language distribution, and coding statistics for any public profile.",
    href: STUDIO_SURFACES["github-stats"].href,
    icon: STUDIO_SURFACES["github-stats"].icon,
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
    name: STUDIO_SURFACES["custom-calculator"].name,
    description:
      "Build reusable calculators by arranging inputs, operations, and outputs visually.",
    href: STUDIO_SURFACES["custom-calculator"].href,
    icon: STUDIO_SURFACES["custom-calculator"].icon,
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
    name: STUDIO_SURFACES["game-hub"].name,
    description:
      "A collection of single-player and multiplayer games, including Chess, Wordle, and Connect Four.",
    href: STUDIO_SURFACES["game-hub"].href,
    icon: STUDIO_SURFACES["game-hub"].icon,
    access: "account",
    type: "game",
    status: "available",
    capability: `${Object.keys(GAME_META).length} games`,
    highlights: [
      "Single-player and multiplayer modes",
      "Room-based sessions",
      "Chess, Wordle, Connect Four, and more",
    ],
    featured: true,
  },
  {
    id: "activity-tracker",
    name: STUDIO_SURFACES["activity-tracker"].name,
    description:
      "Record daily activities and review performance trends through personal dashboards.",
    href: STUDIO_SURFACES["activity-tracker"].href,
    icon: STUDIO_SURFACES["activity-tracker"].icon,
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
    name: STUDIO_SURFACES["currency-calculator"].name,
    description:
      "Count cash denominations, save calculations by date, and keep a searchable history.",
    href: STUDIO_SURFACES["currency-calculator"].href,
    icon: STUDIO_SURFACES["currency-calculator"].icon,
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
    name: STUDIO_SURFACES["file-manager"].name,
    description:
      "Organize private files and folders with cloud storage, upload, and recovery workflows.",
    href: STUDIO_SURFACES["file-manager"].href,
    icon: STUDIO_SURFACES["file-manager"].icon,
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
    id: "scratchpad",
    name: STUDIO_SURFACES.scratchpad.name,
    description:
      "Keep private notes, code fragments, and reusable snippets synchronized in one personal workspace.",
    href: STUDIO_SURFACES.scratchpad.href,
    icon: STUDIO_SURFACES.scratchpad.icon,
    access: "account",
    type: "app",
    status: "beta",
    capability: "Realtime",
    highlights: [
      "Realtime entry synchronization",
      "Text and code entries",
      "Account-backed personal history",
    ],
    featured: false,
  },
  {
    id: "ecommerce",
    name: STUDIO_SURFACES.ecommerce.name,
    description:
      "A separate storefront experiment with product browsing, cart, and transaction flows.",
    href: STUDIO_SURFACES.ecommerce.href,
    icon: STUDIO_SURFACES.ecommerce.icon,
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
