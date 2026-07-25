import { getAppById } from "./hub-config";
import { STUDIO_PRODUCTS } from "./studio-inventory";
import {
  getStudioSurface,
  type StudioSurfaceId,
} from "./studio-surfaces";
import { toolCategories } from "@/lib/tools/tools";

export interface StudioCommandPaletteItem {
  id: string;
  label: string;
  value: string;
  href: string;
  icon: React.ElementType<{ className?: string }>;
  iconClassName?: string;
  external?: boolean;
}

export interface StudioCommandPaletteGroup {
  id: string;
  label: string;
  items: StudioCommandPaletteItem[];
}

const STUDIO_SEARCH_IDS: StudioSurfaceId[] = [
  "studio-home",
  "studio-products",
  "writing",
  "portfolio",
];

const WORKSPACE_IDS = ["activity-tracker", "currency-calculator"];

/** Studio-owned search index; the shared palette only renders these groups. */
export function buildStudioSearchGroups(): StudioCommandPaletteGroup[] {
  const studioItems = STUDIO_SEARCH_IDS.map((id) => {
    const surface = getStudioSurface(id);
    return {
      id: surface.id,
      label: surface.navLabel,
      value: `${surface.navLabel} ${surface.searchKeywords.join(" ")}`,
      href: surface.href,
      icon: surface.icon,
      iconClassName: `size-4 ${surface.color}`,
      external: surface.href.startsWith("http"),
    };
  });

  const productItems = STUDIO_PRODUCTS.map((product) => ({
    id: product.id,
    label: product.name,
    value: `${product.name} ${product.description} ${product.type}`,
    href: product.href,
    icon: product.icon,
    external: product.href.startsWith("http"),
  }));

  const workspaceItems = WORKSPACE_IDS.flatMap((id) => {
    const app = getAppById(id);
    if (!app) return [];

    return app.navItems.map((item) => ({
      id: `${app.id}-${item.id}`,
      label: `${app.name} › ${item.label}`,
      value: `${app.name} ${item.label}`,
      href: item.url ?? app.url ?? `/${app.id}`,
      icon: item.icon,
      iconClassName: `size-4 ${item.color ?? ""}`,
      external: (item.url ?? app.url ?? "").startsWith("http"),
    }));
  });

  const gameApp = getAppById("game-hub");
  const gameItems =
    gameApp?.navItems
      .filter((item) => item.id !== "dashboard")
      .map((item) => ({
        id: `game-hub-${item.id}`,
        label: item.label,
        value: `Game Hub ${item.label}`,
        href: item.url ?? "/games",
        icon: item.icon,
        iconClassName: `size-4 ${item.color ?? ""}`,
        external: (item.url ?? "").startsWith("http"),
      })) ?? [];

  const toolGroups = toolCategories.map((category) => ({
    id: `tools-${category.id}`,
    label: `Tech Tools › ${category.title}`,
    items: category.tools.map((tool) => ({
      id: tool.id,
      label: tool.title,
      value: `${tool.title} ${tool.description} ${category.title}`,
      href: tool.path,
      icon: tool.icon,
    })),
  }));

  return [
    { id: "studio", label: "Studio", items: studioItems },
    { id: "products", label: "Products", items: productItems },
    { id: "workspaces", label: "Workspaces", items: workspaceItems },
    ...(gameItems.length > 0
      ? [{ id: "game-hub", label: "Game Hub", items: gameItems }]
      : []),
    ...toolGroups,
  ];
}
