import type { ReactNode } from "react";

import { cn } from "../lib/utils";

/**
 * Inline feedback that stays attached to a form instead of relying on a
 * transient toast. The live-region semantics make validation and save states
 * available to screen readers while the caller remains responsible for
 * deciding when a message should render.
 */
export function FormMessage({
  children,
  id,
  variant = "error",
  className,
}: {
  children?: ReactNode;
  id?: string;
  variant?: "error" | "hint" | "success";
  className?: string;
}) {
  if (children == null || children === "") return null;

  return (
    <p
      id={id}
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={cn(
        "text-xs",
        variant === "error" && "text-destructive",
        variant === "hint" && "text-muted-foreground",
        variant === "success" && "text-emerald-600 dark:text-emerald-400",
        className,
      )}
    >
      {children}
    </p>
  );
}
