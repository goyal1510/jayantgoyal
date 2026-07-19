"use client";

import type { ComponentType } from "react";

import { Button } from "@repo/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/tooltip";
import { cn } from "@repo/ui/lib/utils";

export function IconAction({
  icon: Icon,
  label,
  iconClassName,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children" | "size"> & {
  icon: ComponentType<{ className?: string }>;
  label: string;
  iconClassName?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          {...props}
          size="icon"
          aria-label={label}
          className={cn("h-8 w-8", className)}
        >
          <Icon className={iconClassName ?? "size-4"} aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
