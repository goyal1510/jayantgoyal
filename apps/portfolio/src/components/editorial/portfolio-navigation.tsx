"use client";

import { ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import type { PortfolioNavigationItem } from "@/lib/portfolio/editorial-data";

type NavigationSurface = "home" | "subpage";

function getItemHref(key: string, surface: NavigationSurface) {
  if (surface === "home") return `#${key}`;
  if (key === "writing") return "/blog";
  if (key === "work") return "/work";
  return `/#${key}`;
}

export function PortfolioNavigation({
  surface,
  ariaLabel,
  items,
}: {
  surface: NavigationSurface;
  ariaLabel: string;
  items: PortfolioNavigationItem[];
}) {
  const pathname = usePathname();
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navigationItems = items;

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => {
      firstLinkRef.current?.focus();
    });
    const desktopQuery = window.matchMedia("(min-width: 761px)");

    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      window.requestAnimationFrame(() => toggleRef.current?.focus());
    };

    document.body.style.overflow = "hidden";
    desktopQuery.addEventListener("change", closeOnDesktop);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      desktopQuery.removeEventListener("change", closeOnDesktop);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="portfolio-navigation" aria-label={ariaLabel}>
        <div className="portfolio-navigation__links">
          {navigationItems.map((item) => (
            <Link
              key={item.key}
              href={getItemHref(item.key, surface)}
              data-nav-key={item.key}
              aria-current={
                (item.key === "writing" && pathname.startsWith("/blog")) ||
                (item.key === "work" && pathname.startsWith("/work"))
                  ? "page"
                  : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
        <button
          ref={toggleRef}
          type="button"
          className={`portfolio-navigation__toggle${menuOpen ? " is-open" : ""}`}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
        </button>
      </nav>

      {menuOpen ? (
        <div id={menuId} className="portfolio-mobile-menu">
          <div className="shell portfolio-mobile-menu__inner">
            <div className="portfolio-mobile-menu__eyebrow">
              <span>Navigation / Portfolio</span>
              <span>
                {String(navigationItems.length).padStart(2, "0")} sections
              </span>
            </div>

            <ol className="portfolio-mobile-menu__list">
              {navigationItems.map((item, index) => {
                const current =
                  (item.key === "writing" && pathname.startsWith("/blog")) ||
                  (item.key === "work" && pathname.startsWith("/work"));

                return (
                  <li key={item.key}>
                    <Link
                      ref={index === 0 ? firstLinkRef : undefined}
                      href={getItemHref(item.key, surface)}
                      aria-current={current ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="portfolio-mobile-menu__index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <strong>{item.label}</strong>
                      <span className="portfolio-mobile-menu__note">
                        {item.note}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>

            <div className="portfolio-mobile-menu__footer">
              <p>Have an idea worth making real?</p>
              <Link
                href={surface === "home" ? "#contact" : "/#contact"}
                onClick={() => setMenuOpen(false)}
              >
                Let&apos;s talk <ArrowDownRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
