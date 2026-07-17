"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Search, Star } from "lucide-react";

import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { cn } from "@repo/ui/lib/utils";

import { ToolFavoriteButton } from "@/components/tools/tool-favorite-button";
import {
  toolCategories,
  type Tool,
  type ToolCategory,
} from "@/lib/tools/tools";
import { getToolToneIndex, TOOL_TONES } from "@/lib/tools/tool-tones";
import {
  useToolsUsageHydration,
  useToolsUsageStore,
} from "@/lib/tools/use-tools-usage-store";

const ALL_FILTER = "all";
const FAVORITES_FILTER = "favorites";

type CatalogTool = {
  tool: Tool;
  category: ToolCategory;
  toneIndex: number;
};

const catalogTools: CatalogTool[] = toolCategories
  .flatMap((category) => category.tools.map((tool) => ({ tool, category })))
  .map((entry, index) => ({
    ...entry,
    toneIndex: getToolToneIndex(entry.tool.id, index),
  }));

function ToolCard({
  tool,
  category,
  toneIndex,
  showCategory,
  href,
}: CatalogTool & { showCategory: boolean; href: string }) {
  const Icon = tool.icon;

  return (
    <Card
      className={cn(
        "group relative h-full min-h-[11.5rem] overflow-hidden rounded-[1.35rem] shadow-none transition-transform duration-300 hover:-translate-y-0.5",
        TOOL_TONES[toneIndex],
      )}
    >
      <Link
        href={href}
        onClick={() => window.scrollTo({ top: 0, behavior: "auto" })}
        className="flex h-full min-h-[11.5rem] flex-col p-5 pr-16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className="inline-flex size-12 items-center justify-center rounded-xl border border-current/15 bg-white/15 dark:bg-black/10">
          <Icon className="size-5" />
        </span>

        <span className="mt-5 block text-lg font-semibold leading-tight tracking-[-0.025em]">
          {tool.title}
        </span>
        <span className="mt-2 line-clamp-2 text-sm leading-6 opacity-85">
          {tool.description}
        </span>

        <span className="mt-auto flex items-end justify-between gap-3 pt-5">
          {showCategory ? (
            <span className="font-[family-name:var(--font-ibm-plex-mono)] text-[0.65rem] font-medium uppercase tracking-[0.13em] opacity-85">
              {category.title}
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
          <ArrowUpRight
            className="size-4 shrink-0 opacity-65 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
            aria-hidden="true"
          />
        </span>
      </Link>

      <ToolFavoriteButton
        toolId={tool.id}
        size="icon"
        variant="ghost"
        className="absolute right-4 top-4 z-10 size-10 rounded-full border border-current/20 bg-white/20 p-0 text-current shadow-none hover:bg-white/35 dark:bg-black/10 dark:hover:bg-black/20"
      />
    </Card>
  );
}

function EmptyState({
  favorites,
  hasQuery,
}: {
  favorites: boolean;
  hasQuery: boolean;
}) {
  const Icon = favorites ? Star : Search;
  const title = favorites
    ? hasQuery
      ? "No favorite tools found"
      : "No favorite tools yet"
    : "No tools found";
  const description = favorites
    ? hasQuery
      ? "Try another search or return to all tools."
      : "Use the star on any tool to keep it in this filter."
    : "Try another search or choose a different category.";

  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function ToolsClient({
  initialQuery = "",
  initialCategory = ALL_FILTER,
}: {
  initialQuery?: string;
  initialCategory?: string;
}) {
  const [query, setQuery] = React.useState(initialQuery);
  const [selectedFilter, setSelectedFilter] = React.useState(initialCategory);
  const hasHydrated = useToolsUsageHydration();
  const favoriteToolIds = useToolsUsageStore((state) => state.favoriteToolIds);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredTools = React.useMemo(() => {
    return catalogTools.filter(({ tool, category }) => {
      const matchesFilter =
        selectedFilter === ALL_FILTER ||
        (selectedFilter === FAVORITES_FILTER &&
          favoriteToolIds.includes(tool.id)) ||
        selectedFilter === category.id;

      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;

      return `${tool.title} ${tool.description} ${category.title}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [favoriteToolIds, normalizedQuery, selectedFilter]);

  const showCategory =
    selectedFilter === ALL_FILTER || selectedFilter === FAVORITES_FILTER;

  const catalogQuery = React.useMemo(() => {
    const params = new URLSearchParams();
    if (selectedFilter !== ALL_FILTER) {
      params.set("category", selectedFilter);
    }
    if (query.trim()) params.set("q", query.trim());
    return params.toString();
  }, [query, selectedFilter]);

  const syncCatalogUrl = React.useCallback(
    (nextFilter: string, nextQuery: string) => {
      const params = new URLSearchParams();
      if (nextFilter !== ALL_FILTER) params.set("category", nextFilter);
      if (nextQuery.trim()) params.set("q", nextQuery.trim());
      const serialized = params.toString();
      window.history.replaceState(
        null,
        "",
        serialized ? `/tools?${serialized}` : "/tools",
      );
    },
    [],
  );

  const selectFilter = (filter: string) => {
    setSelectedFilter(filter);
    syncCatalogUrl(filter, query);
  };

  const updateQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    syncCatalogUrl(selectedFilter, nextQuery);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-3">
          <h1 className="text-balance text-4xl font-semibold leading-none tracking-[-0.045em] sm:text-5xl">
            Tech Tools
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            Search, filter, and save focused utilities in one catalog.
          </p>
        </div>

        <div className="relative w-full xl:max-w-md">
          <label htmlFor="tool-catalog-search" className="sr-only">
            Search tools
          </label>
          <Search
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="tool-catalog-search"
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Search tools..."
            className="h-11 rounded-full pl-11 pr-4 shadow-none"
          />
        </div>
      </header>

      <section className="space-y-4" aria-labelledby="tool-results">
        <div className="flex flex-col gap-3 border-b border-border/80 pb-4 xl:flex-row xl:items-end xl:justify-between">
          <div
            className="flex flex-wrap gap-2"
            aria-label="Filter tools by category"
          >
            <Button
              type="button"
              variant={selectedFilter === ALL_FILTER ? "default" : "outline"}
              aria-pressed={selectedFilter === ALL_FILTER}
              className="h-11 rounded-full px-5 shadow-none sm:h-9"
              onClick={() => selectFilter(ALL_FILTER)}
            >
              All
            </Button>
            <Button
              type="button"
              variant={
                selectedFilter === FAVORITES_FILTER ? "default" : "outline"
              }
              aria-pressed={selectedFilter === FAVORITES_FILTER}
              disabled={!hasHydrated}
              className="h-11 rounded-full px-5 shadow-none sm:h-9"
              onClick={() => selectFilter(FAVORITES_FILTER)}
            >
              <Star className="size-4" aria-hidden="true" />
              Favorites
            </Button>
            {toolCategories.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={selectedFilter === category.id ? "default" : "outline"}
                aria-pressed={selectedFilter === category.id}
                className="h-11 rounded-full px-5 shadow-none sm:h-9"
                onClick={() => selectFilter(category.id)}
              >
                {category.title}
              </Button>
            ))}
          </div>

          <p
            id="tool-results"
            className="shrink-0 font-[family-name:var(--font-ibm-plex-mono)] text-xs uppercase tracking-[0.14em] text-muted-foreground"
            aria-live="polite"
          >
            {filteredTools.length}{" "}
            {filteredTools.length === 1 ? "tool" : "tools"}
          </p>
        </div>

        {filteredTools.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filteredTools.map(({ tool, category, toneIndex }) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                category={category}
                toneIndex={toneIndex}
                showCategory={showCategory}
                href={`${tool.path}${catalogQuery ? `?${catalogQuery}` : ""}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            favorites={selectedFilter === FAVORITES_FILTER}
            hasQuery={Boolean(normalizedQuery)}
          />
        )}
      </section>
    </div>
  );
}
