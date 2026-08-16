"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { useSidebar } from "./sidebar";

export interface ApplicationCommandPaletteItem {
  id: string;
  label: string;
  value: string;
  href: string;
  icon: React.ElementType<{ className?: string }>;
  iconClassName?: string;
  external?: boolean;
}

export interface ApplicationCommandPaletteGroup {
  id: string;
  label: string;
  items: readonly ApplicationCommandPaletteItem[];
}

/**
 * Shared command-palette presentation. Applications provide only their
 * searchable destinations; route ownership and search indexing stay local.
 */
export function ApplicationCommandPalette({
  ariaLabel = "Search",
  title = "Search",
  description = "Search application destinations",
  placeholder = "Search…",
  emptyMessage = "No results found.",
  groups,
}: {
  ariaLabel?: string;
  title?: string;
  description?: string;
  placeholder?: string;
  emptyMessage?: string;
  groups: readonly ApplicationCommandPaletteGroup[];
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const navigate = React.useCallback(
    (item: ApplicationCommandPaletteItem) => {
      setOpen(false);
      if (isMobile) setOpenMobile(false);

      if (item.external) {
        window.open(item.href, "_blank", "noopener,noreferrer");
        return;
      }

      router.push(item.href);
    },
    [isMobile, router, setOpenMobile],
  );

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
        className="border-input bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center gap-2 rounded-md border px-2 shadow-xs transition-colors sm:w-48 sm:px-3"
      >
        <Search className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="text-foreground/70 hidden flex-1 text-left text-xs font-medium sm:block">
          Search
        </span>
        <kbd className="bg-background text-muted-foreground pointer-events-none hidden h-6 items-center gap-0.5 rounded border px-2 font-mono text-xs font-medium select-none sm:inline-flex">
          <span aria-hidden="true">⌘</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
      >
        <CommandInput placeholder={placeholder} />
        <CommandList>
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.id} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.value}
                  onSelect={() => navigate(item)}
                >
                  <item.icon
                    className={item.iconClassName ?? "size-4"}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
