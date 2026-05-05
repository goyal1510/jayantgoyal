"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/ui/command";
import { Separator } from "@repo/ui/separator";

export type ChipOption = { value: string; label: string };

export function ChipFilter({
  label,
  options,
  selected,
  onToggle,
  onClear,
  align = "start",
  showSearch = true,
}: {
  label: string;
  options: ChipOption[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
  align?: "start" | "center" | "end";
  showSearch?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const count = selected.size;
  const selectedLabels = options
    .filter((o) => selected.has(o.value))
    .map((o) => o.label);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 shrink-0 gap-1.5 border-dashed"
        >
          <Plus className="h-3.5 w-3.5" />
          {label}
          <Separator
            orientation="vertical"
            className={cn("mx-1 h-4", count === 0 && "invisible")}
          />
          <Badge
            variant="secondary"
            className={cn("rounded-sm px-1 font-normal", count === 0 && "invisible")}
          >
            {count}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align={align}>
        <Command>
          {showSearch && (
            <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />
          )}
          <CommandList>
            <CommandEmpty>No options.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = selected.has(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    onSelect={() => onToggle(opt.value)}
                    className="cursor-pointer"
                  >
                    <span
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="flex-1">{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {count > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={onClear}
                    className="cursor-pointer justify-center text-xs"
                  >
                    Clear ({count})
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
        {count > 0 && (
          <div className="border-t px-2 py-1.5 text-[11px] text-muted-foreground">
            {selectedLabels.slice(0, 2).join(", ")}
            {selectedLabels.length > 2 && ` +${selectedLabels.length - 2}`}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
