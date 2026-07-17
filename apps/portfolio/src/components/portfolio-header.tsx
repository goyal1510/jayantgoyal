"use client";

import { Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";

import { usePortfolioData } from "@/lib/portfolio/use-portfolio-data";

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
}

export function PortfolioHeader() {
  const { data } = usePortfolioData();
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleNavigate = (sectionId: string) => {
    setMobileOpen(false);
    if (pathname === "/") {
      scrollToSection(sectionId);
      return;
    }

    router.push(`/#${sectionId}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/#home"
          className="text-left"
          aria-label="Go to the top of the portfolio"
        >
          <span className="block text-sm font-semibold tracking-wide">
            Jayant Goyal
          </span>
          <span className="block text-xs text-muted-foreground">
            Full-Stack Developer
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Portfolio"
        >
          {data.NAV_ITEMS.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate(item.id)}
            >
              {item.label}
            </Button>
          ))}
          <Button asChild variant="ghost" size="sm">
            <Link href="/blog">Blog</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            aria-label="Toggle color theme"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label="Toggle portfolio navigation"
          >
            {mobileOpen ? (
              <X className="size-4" />
            ) : (
              <Menu className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <nav
        className={cn(
          "mx-auto grid max-w-7xl grid-cols-2 gap-2 border-t px-4 py-3 sm:grid-cols-4 lg:hidden",
          mobileOpen ? "grid" : "hidden",
        )}
        aria-label="Mobile portfolio"
      >
        {data.NAV_ITEMS.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            size="sm"
            className="justify-start"
            onClick={() => handleNavigate(item.id)}
          >
            {item.label}
          </Button>
        ))}
        <Button asChild variant="ghost" size="sm" className="justify-start">
          <Link href="/blog" onClick={() => setMobileOpen(false)}>
            Blog
          </Link>
        </Button>
      </nav>
    </header>
  );
}
