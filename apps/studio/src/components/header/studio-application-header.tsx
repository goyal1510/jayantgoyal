import type { ReactNode } from "react";

import { cn } from "@repo/ui/lib/utils";
import { SidebarTrigger } from "@repo/ui/sidebar";

export function StudioApplicationHeader({
  breadcrumb,
  actions,
  className,
}: {
  breadcrumb: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 max-w-full shrink-0 items-center gap-2 border-b bg-background/95 px-4 transition-[width,height] ease-linear backdrop-blur supports-[backdrop-filter]:bg-background/80 group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        <SidebarTrigger className="-ml-1 shrink-0 md:hidden" />
        <div className="min-w-0 flex-1 overflow-hidden">{breadcrumb}</div>
      </div>
      {actions != null ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
