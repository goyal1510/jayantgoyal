import Link from "next/link";
import { ArrowRight, Compass, Search } from "lucide-react";

import { APP_BRANDS } from "@repo/brand";
import { Button } from "@repo/ui/button";

import {
  getStudioProduct,
  type StudioProduct,
} from "@/lib/config/studio-inventory";
import { GAME_META } from "@/lib/games/config";
import { allTools } from "@/lib/tools/tools";

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

export function StudioInventory() {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-5 pb-6 pt-0 sm:space-y-6 sm:pb-10 lg:pb-12">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] lg:gap-6">
        <div className="flex flex-col justify-start px-1 py-6 sm:px-4 sm:py-8 lg:px-0 lg:pr-10 xl:pr-16">
          <p className="font-[family-name:var(--font-ibm-plex-mono)] text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground sm:text-sm">
            {APP_BRANDS.studio.publicName}
          </p>
          <h1 className="mt-7 max-w-3xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl xl:text-7xl">
            A studio for
            <span className="block">practical ideas.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Tools, workspaces, and experiments designed to solve real everyday
            problems.
          </p>
          <div className="mt-10">
            <Button
              asChild
              size="lg"
              className="h-14 rounded-lg px-6 text-base shadow-none"
            >
              <Link href="/products">
                <Compass className="size-5" />
                Explore the collection
              </Link>
            </Button>
          </div>
        </div>

        <article className="flex min-h-[28rem] flex-col rounded-xl bg-[#ff4d3f] p-7 text-[#211512] sm:p-9 lg:p-10">
          <span className="inline-flex size-14 items-center justify-center rounded-lg border border-[#211512]/25 bg-[#fff7ed]/15">
            <techTools.icon className="size-7" strokeWidth={1.8} />
          </span>
          <div className="mt-9">
            <h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {techTools.name}
            </h2>
            <div className="mt-6 h-px w-10 bg-current" aria-hidden="true" />
            <p className="mt-5 text-lg font-medium">
              {allTools.length} focused utilities
            </p>
          </div>
          <form action="/tools" className="mt-auto pt-10">
            <label htmlFor="studio-tool-search" className="sr-only">
              Search tools
            </label>
            <div className="flex h-16 items-center gap-3 rounded-lg border border-[#211512]/10 bg-[#fffaf2] px-5 focus-within:ring-2 focus-within:ring-[#211512]/60">
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

      <section className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr] lg:gap-6">
        <Link
          href={fileManager.href}
          className="group flex min-h-52 items-center gap-5 rounded-xl border border-border/80 p-7 transition-colors hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-8"
        >
          <span className="inline-flex size-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-primary/25 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105 sm:size-24">
            <fileManager.icon
              className="size-10 sm:size-12"
              strokeWidth={1.6}
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {fileManager.name}
            </span>
            <span className="mt-3 block max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              {fileManager.description}
            </span>
          </span>
          <ArrowRight className="size-7 shrink-0 transition-transform duration-300 group-hover:translate-x-2" />
        </Link>

        <Link
          href={gameHub.href}
          className="group flex min-h-52 items-center gap-5 rounded-xl bg-[#e8dcf5] p-7 text-[#211512] transition-colors hover:bg-[#dfcff0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-[#2f2938] dark:text-[#fff8ef] dark:hover:bg-[#382f43] sm:p-8"
        >
          <span className="inline-flex size-20 shrink-0 items-center justify-center rounded-2xl border border-current/20 bg-white/20 transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105 sm:size-24">
            <gameHub.icon className="size-10 sm:size-12" strokeWidth={1.6} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {gameHub.name}
            </span>
            <span className="mt-3 block text-base leading-7 opacity-75 sm:text-lg">
              {Object.keys(GAME_META).length} games. {gameHub.description}
            </span>
          </span>
          <ArrowRight className="size-7 shrink-0 transition-transform duration-300 group-hover:translate-x-2" />
        </Link>
      </section>
    </div>
  );
}
