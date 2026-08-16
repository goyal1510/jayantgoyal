import type { ComponentType, ReactNode } from "react";

import { cn } from "@jayant/web-ui/lib/utils";

const toneClasses = {
  blue: "border-[#a8c3e7] bg-[#dce9f8] text-[#211512] dark:border-[#40536b] dark:bg-[#243142] dark:text-[#fff8ef]",
  coral: "border-[#d93328] bg-[#ff5a4f] text-[#211512]",
  lavender:
    "border-[#cfc0e4] bg-[#e8dcf5] text-[#211512] dark:border-[#5c5068] dark:bg-[#2f2938] dark:text-[#fff8ef]",
  sage: "border-[#bdc4a3] bg-[#d9ddc3] text-[#211512] dark:border-[#4b594b] dark:bg-[#29312a] dark:text-[#fff8ef]",
  sand: "border-[#d8c5a6] bg-[#f2e2c8] text-[#211512] dark:border-[#5e5143] dark:bg-[#332d28] dark:text-[#fff8ef]",
} as const;

export type WorkspaceTone = keyof typeof toneClasses;

export interface WorkspaceHeaderProps {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  tone?: WorkspaceTone;
  toneClassName?: string;
  actions?: ReactNode;
  details?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Shared visual header for product workspaces; application copy and actions stay local. */
export function WorkspaceHeader({
  icon: Icon,
  title,
  description,
  tone = "lavender",
  toneClassName,
  actions,
  details,
  children,
  className,
}: WorkspaceHeaderProps) {
  return (
    <header
      className={cn(
        "overflow-hidden rounded-[1.75rem] border p-5 sm:p-6 lg:p-7",
        toneClassName ?? toneClasses[tone],
        className,
      )}
    >
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0 max-w-4xl space-y-4">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-current/15 bg-white/15 dark:bg-black/10">
              <Icon className="size-6" strokeWidth={1.7} />
            </span>
            <h1 className="min-w-0 text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
          </div>
          <p className="max-w-3xl text-base leading-7 opacity-85 sm:text-lg sm:leading-8">
            {description}
          </p>
          {details ? <div>{details}</div> : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>
        ) : null}
      </div>

      {children ? (
        <div className="mt-5 border-t border-current/15 pt-5">{children}</div>
      ) : null}
    </header>
  );
}
