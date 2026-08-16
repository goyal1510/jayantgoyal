"use client";

import type { ReactNode } from "react";

import { Button } from "@jayantgoyal/web-ui/button";
import { cn } from "@jayantgoyal/web-ui/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@jayantgoyal/web-ui/sheet";

export type GameSetupPath = "local" | "computer" | "online";

export function GameSetupSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "flex h-dvh flex-col gap-0 overflow-hidden p-0 sm:max-w-xl",
          className,
        )}
      >
        <SheetHeader className="border-b border-border/80 px-6 py-5 pr-14 text-left">
          <SheetTitle className="text-2xl tracking-[-0.035em]">
            {title}
          </SheetTitle>
          <SheetDescription className="leading-6">
            {description}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {footer ? (
          <div className="border-t border-border/80 bg-background/95 px-6 py-4 backdrop-blur">
            {footer}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function GameSetupPathPicker({
  value,
  onValueChange,
  options,
}: {
  value: GameSetupPath;
  onValueChange: (value: GameSetupPath) => void;
  options: Array<{
    value: GameSetupPath;
    label: string;
    description: string;
    icon: ReactNode;
  }>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3" aria-label="Choose how to play">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={value === option.value ? "secondary" : "outline"}
          aria-pressed={value === option.value}
          onClick={() => onValueChange(option.value)}
          className="h-auto min-h-24 flex-col items-start justify-start gap-2 rounded-xl p-3 text-left whitespace-normal"
        >
          <span className="flex items-center gap-2 font-semibold">
            {option.icon}
            {option.label}
          </span>
          <span className="text-xs font-normal leading-5 text-muted-foreground">
            {option.description}
          </span>
        </Button>
      ))}
    </div>
  );
}
