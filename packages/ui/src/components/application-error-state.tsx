import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@repo/ui/lib/utils";

export function ApplicationErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid min-h-48 place-items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center", className)} role="alert">
      <div className="grid justify-items-center gap-3">
        <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
        <div className="space-y-1">
          <h2 className="font-medium">{title}</h2>
          {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
    </div>
  );
}
