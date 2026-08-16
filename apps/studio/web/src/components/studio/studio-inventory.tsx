import Link from "next/link";
import { ArrowRight, Compass, Search } from "lucide-react";

import { APP_BRANDS } from "@jayant/web-brand";
import { Button } from "@jayant/web-ui/button";

import {
  getStudioProduct,
  type StudioProduct,
} from "@/lib/config/studio-inventory";
import { GAME_META } from "@/lib/games/config";
import { allTools, toolCategories } from "@/lib/tools/tools";

function requiredProduct(id: string): StudioProduct {
  const product = getStudioProduct(id);

  if (!product) {
    throw new Error(`Studio product not found: ${id}`);
  }

  return product;
}

const techTools = requiredProduct("tech-tools");
const fileManager = requiredProduct("file-manager");
const gameHub = requiredProduct("game-hub");

const featuredToolCategoryIds = [
  "generators",
  "converters",
  "text-tools",
  "code-dev-tools",
  "parsers-validators",
  "calculators",
];

const featuredToolCategories = featuredToolCategoryIds.flatMap((categoryId) => {
  const category = toolCategories.find(
    (candidate) => candidate.id === categoryId,
  );
  return category ? [category] : [];
});

export function StudioInventory() {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 pb-6 pt-0 sm:space-y-6 sm:pb-10 lg:grid lg:h-[calc(100svh-8rem)] lg:min-h-[36rem] lg:grid-rows-[minmax(0,1fr)_11rem] lg:gap-5 lg:space-y-0 lg:pb-0 xl:h-[calc(100svh-9rem)]">
      <section className="grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] lg:gap-6">
        <div className="flex min-h-0 flex-col justify-center px-1 py-6 sm:px-4 sm:py-8 lg:px-0 lg:py-0 lg:pr-10 xl:pr-12 2xl:pr-16">
          <p className="font-[family-name:var(--font-ibm-plex-mono)] text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground sm:text-sm">
            {APP_BRANDS.studio.publicName}
          </p>
          <h1 className="mt-7 max-w-3xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:mt-4 lg:text-5xl 2xl:mt-7 2xl:text-7xl">
            A studio for
            <span className="block">practical ideas.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl lg:mt-4 lg:text-base lg:leading-7 2xl:mt-7 2xl:text-xl 2xl:leading-8">
            Tools, workspaces, and experiments designed to solve real everyday
            problems.
          </p>
          <div className="mt-10 lg:mt-6 2xl:mt-10">
            <Button
              asChild
              size="lg"
              className="h-14 rounded-lg px-6 text-base shadow-none lg:h-12 2xl:h-14"
            >
              <Link href="/products">
                <Compass className="size-5" />
                Explore the collection
              </Link>
            </Button>
          </div>
        </div>

        <article className="flex min-h-[28rem] flex-col rounded-xl bg-[#ff4d3f] p-7 text-[#211512] sm:p-9 lg:min-h-0 lg:p-7 2xl:p-10">
          <div className="flex items-center gap-5 sm:gap-6">
            <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-lg border border-[#211512]/25 bg-[#fff7ed]/15 lg:size-12 2xl:size-14">
              <techTools.icon
                className="size-7 lg:size-6 2xl:size-7"
                strokeWidth={1.8}
              />
            </span>
            <div className="min-w-0">
              <h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-4xl 2xl:text-5xl">
                {techTools.name}
              </h2>
              <p className="mt-2 text-lg font-medium lg:text-base 2xl:text-lg">
                {allTools.length} utilities across {toolCategories.length}{" "}
                categories
              </p>
            </div>
          </div>

          <div className="mt-8 lg:mt-5 2xl:mt-8">
            <div className="flex items-center justify-between gap-4">
              <p className="font-[family-name:var(--font-ibm-plex-mono)] text-xs font-medium uppercase tracking-[0.16em]">
                Browse categories
              </p>
              <Link
                href="/tools"
                className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#211512]"
              >
                View all
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <nav
              aria-label="Featured tool categories"
              className="mt-3 grid grid-cols-2 gap-x-5"
            >
              {featuredToolCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/tools?category=${category.id}`}
                  className="group flex min-w-0 items-center gap-2 border-b border-[#211512]/20 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#211512]"
                >
                  <category.icon className="size-4 shrink-0 opacity-75" />
                  <span className="min-w-0 flex-1 truncate font-medium group-hover:underline">
                    {category.title}
                  </span>
                  <span className="font-[family-name:var(--font-ibm-plex-mono)] text-xs opacity-65">
                    {category.tools.length}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <form action="/tools" className="mt-auto pt-7 lg:pt-5 2xl:pt-7">
            <label htmlFor="studio-tool-search" className="sr-only">
              Search tools
            </label>
            <div className="flex h-16 items-center gap-3 rounded-lg border border-[#211512]/10 bg-[#fffaf2] px-5 focus-within:ring-2 focus-within:ring-[#211512]/60 lg:h-14 2xl:h-16">
              <Search className="size-5 shrink-0" aria-hidden="true" />
              <input
                id="studio-tool-search"
                name="q"
                type="search"
                placeholder="Search tools..."
                className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#5d514c]"
              />
            </div>
          </form>
        </article>
      </section>

      <section className="grid gap-5 lg:h-44 lg:grid-cols-[1.12fr_0.88fr] lg:gap-6">
        <Link
          href={fileManager.href}
          className="group flex min-h-52 items-center gap-5 rounded-xl border border-border/80 p-7 transition-colors hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-8 lg:min-h-0 lg:p-6 2xl:p-8"
        >
          <span className="inline-flex size-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-primary/25 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105 sm:size-24 lg:size-20 2xl:size-24">
            <fileManager.icon
              className="size-10 sm:size-12 lg:size-10 2xl:size-12"
              strokeWidth={1.6}
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-3xl 2xl:text-4xl">
              {fileManager.name}
            </span>
            <span className="mt-3 block max-w-xl text-base leading-7 text-muted-foreground sm:text-lg lg:mt-2 lg:text-sm lg:leading-6 2xl:mt-3 2xl:text-lg 2xl:leading-7">
              {fileManager.description}
            </span>
          </span>
          <ArrowRight className="size-7 shrink-0 transition-transform duration-300 group-hover:translate-x-2" />
        </Link>

        <Link
          href={gameHub.href}
          className="group flex min-h-52 items-center gap-5 rounded-xl bg-[#e8dcf5] p-7 text-[#211512] transition-colors hover:bg-[#dfcff0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-[#2f2938] dark:text-[#fff8ef] dark:hover:bg-[#382f43] sm:p-8 lg:min-h-0 lg:p-6 2xl:p-8"
        >
          <span className="inline-flex size-20 shrink-0 items-center justify-center rounded-2xl border border-current/20 bg-white/20 transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105 sm:size-24 lg:size-20 2xl:size-24">
            <gameHub.icon
              className="size-10 sm:size-12 lg:size-10 2xl:size-12"
              strokeWidth={1.6}
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-3xl 2xl:text-4xl">
              {gameHub.name}
            </span>
            <span className="mt-3 block text-base leading-7 opacity-75 sm:text-lg lg:mt-2 lg:text-sm lg:leading-6 2xl:mt-3 2xl:text-lg 2xl:leading-7">
              {Object.keys(GAME_META).length} games. {gameHub.description}
            </span>
          </span>
          <ArrowRight className="size-7 shrink-0 transition-transform duration-300 group-hover:translate-x-2" />
        </Link>
      </section>
    </div>
  );
}
