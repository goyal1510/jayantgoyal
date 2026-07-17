"use client";

import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import { APP_BRANDS } from "@repo/brand";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Separator } from "@repo/ui/separator";
import { SidebarTrigger } from "@repo/ui/sidebar";

function getPageLabel(pathname: string): string | null {
  if (pathname.startsWith("/blog")) return "Blog";
  if (pathname.startsWith("/resume")) return "Resume";
  return null;
}

export function PortfolioTopbar() {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const pageLabel = getPageLabel(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator orientation="vertical" className="mr-2 h-4 shrink-0" />
      <div className="min-w-0 flex-1 truncate text-sm">
        <span className="font-medium">{APP_BRANDS.portfolio.name}</span>
        {pageLabel && (
          <>
            <span className="px-2 text-muted-foreground">/</span>
            <span className="text-muted-foreground">{pageLabel}</span>
          </>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Change theme">
            <Sun className="size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme("light")}>
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
