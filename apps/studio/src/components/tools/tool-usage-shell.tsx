"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@repo/ui/lib/utils";

import { ToolFavoriteButton } from "@/components/tools/tool-favorite-button";
import { getToolTone } from "@/lib/tools/tool-tones";
import {
  allTools,
  getToolByPath,
  getToolCategoryByPath,
} from "@/lib/tools/tools";

interface ToolUsageShellProps {
  children: ReactNode;
}

export function ToolUsageShell({ children }: ToolUsageShellProps) {
  const pathname = usePathname();
  const tool = getToolByPath(pathname);
  const category = getToolCategoryByPath(pathname);

  if (!tool || !category) {
    return <>{children}</>;
  }

  const catalogIndex = allTools.findIndex(
    (candidate) => candidate.id === tool.id,
  );
  const tone = getToolTone(tool.id, Math.max(catalogIndex, 0));

  return (
    <div className="space-y-6">
      <header
        className={cn(
          "overflow-hidden rounded-[1.75rem] border p-6 sm:p-8 lg:p-9",
          tone,
        )}
      >
        <div className="grid gap-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0 max-w-4xl space-y-5">
            <div>
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-current/15 bg-white/15 dark:bg-black/10">
                <tool.icon className="size-6" />
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                {tool.title}
              </h1>
              <p className="max-w-3xl text-base leading-7 opacity-85 sm:text-lg sm:leading-8">
                {tool.description}
              </p>
            </div>
          </div>

          <ToolFavoriteButton
            toolId={tool.id}
            size="default"
            variant="ghost"
            className="h-11 rounded-xl border border-current/20 bg-white/20 px-5 text-current shadow-none hover:bg-white/35 hover:text-current dark:bg-black/10 dark:hover:bg-black/20"
          />
        </div>
      </header>

      {children}
    </div>
  );
}
