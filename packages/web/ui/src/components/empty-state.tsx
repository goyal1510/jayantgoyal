import type { ComponentType, ReactNode } from "react";

import { cn } from "@jayant/web-ui/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid min-h-48 place-items-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center", className)}>
      <div className="grid justify-items-center gap-3">
        {Icon ? <Icon className="size-8 text-muted-foreground" aria-hidden="true" /> : null}
        <div className="space-y-1">
          <h2 className="font-medium">{title}</h2>
          {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
    </div>
  );
}
