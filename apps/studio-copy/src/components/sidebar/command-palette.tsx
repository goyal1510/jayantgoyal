"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/command";
import { cn } from "@repo/ui/lib/utils";
import { useSidebar } from "@repo/ui/sidebar";

import { getAppById } from "@/lib/config/hub-config";
import { STUDIO_PRODUCTS } from "@/lib/config/studio-inventory";
import {
  getStudioSurface,
  type StudioSurfaceId,
} from "@/lib/config/studio-surfaces";
import { toolCategories } from "@/lib/tools/tools";

const STUDIO_SEARCH_IDS: StudioSurfaceId[] = [
  "studio-home",
  "studio-products",
  "blog",
  "portfolio",
];

const WORKSPACE_IDS = ["activity-tracker", "currency-calculator"];

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = React.useCallback(
    (url: string) => {
      setOpen(false);
      if (isMobile) setOpenMobile(false);

      if (url.startsWith("http")) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      router.push(url);
    },
    [isMobile, router, setOpenMobile],
  );

  const workspaceItems = React.useMemo(
    () =>
      WORKSPACE_IDS.flatMap((id) => {
        const app = getAppById(id);
        if (!app) return [];

        return app.navItems.map((item) => ({
          ...item,
          appName: app.name,
          url: item.url ?? app.url ?? `/${app.id}`,
        }));
      }),
    [],
  );

  const gameApp = getAppById("game-hub");
  const gameItems =
    gameApp?.navItems.filter((item) => item.id !== "dashboard") ?? [];

  return (
    <>
      <button
        type="button"
        aria-label="Search Studio"
        onClick={() => setOpen(true)}
        className="border-input bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center gap-2 rounded-md border px-2 shadow-xs transition-colors sm:w-48 sm:px-3"
      >
        <Search className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="text-foreground/70 hidden flex-1 text-left text-xs font-medium sm:block">
          Search
        </span>
        <kbd className="bg-background text-muted-foreground pointer-events-none hidden h-6 items-center gap-0.5 rounded border px-2 font-mono text-xs font-medium select-none sm:inline-flex">
          <span>&#8984;</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Studio"
        description="Search Studio pages, products, tools, games, and workspaces"
      >
        <CommandInput placeholder="Search Studio..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Studio">
            {STUDIO_SEARCH_IDS.map((id) => {
              const surface = getStudioSurface(id);

              return (
                <CommandItem
                  key={surface.id}
                  value={`${surface.navLabel} ${surface.searchKeywords.join(" ")}`}
                  onSelect={() => navigate(surface.href)}
                >
                  <surface.icon className={cn("size-4", surface.color)} />
                  <span>{surface.navLabel}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandGroup heading="Products">
            {STUDIO_PRODUCTS.map((product) => (
              <CommandItem
                key={product.id}
                value={`${product.name} ${product.description} ${product.type}`}
                onSelect={() => navigate(product.href)}
              >
                <product.icon className="size-4" />
                <span>{product.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading="Workspaces">
            {workspaceItems.map((item) => (
              <CommandItem
                key={`${item.appName}-${item.id}`}
                value={`${item.appName} ${item.label}`}
                onSelect={() => navigate(item.url)}
              >
                <item.icon className={cn("size-4", item.color)} />
                <span>
                  {item.appName} &rsaquo; {item.label}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          {gameItems.length > 0 ? (
            <CommandGroup heading="Game Hub">
              {gameItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`Game Hub ${item.label}`}
                  onSelect={() => navigate(item.url ?? "/games")}
                >
                  <item.icon className={cn("size-4", item.color)} />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {toolCategories.map((category) => (
            <CommandGroup
              key={category.id}
              heading={`Tech Tools \u203A ${category.title}`}
            >
              {category.tools.map((tool) => (
                <CommandItem
                  key={tool.id}
                  value={`${tool.title} ${tool.description} ${category.title}`}
                  onSelect={() => navigate(tool.path)}
                >
                  <tool.icon className="size-4" />
                  <span>{tool.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
