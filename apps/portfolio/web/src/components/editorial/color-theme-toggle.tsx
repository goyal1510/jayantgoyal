"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { useHasHydrated } from "./use-has-hydrated";

const THEME_STORAGE_KEY = "portfolio-color-theme";

type ColorTheme = "light" | "dark";

function applyColorTheme(theme: ColorTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function readColorTheme(): ColorTheme {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ColorThemeToggle() {
  const hasHydrated = useHasHydrated();
  const [theme, setTheme] = useState<ColorTheme>("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => {
      const nextTheme = readColorTheme();
      applyColorTheme(nextTheme);
      setTheme(nextTheme);
    };

    syncTheme();
    mediaQuery.addEventListener("change", syncTheme);
    return () => mediaQuery.removeEventListener("change", syncTheme);
  }, []);

  const visibleTheme = hasHydrated ? theme : "light";
  const nextThemeLabel = visibleTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={`color-theme-toggle${visibleTheme === "dark" ? " is-dark" : ""}`}
      aria-label={`Switch to ${nextThemeLabel} mode`}
      title={`Switch to ${nextThemeLabel} mode`}
      aria-pressed={visibleTheme === "dark"}
      onClick={() => {
        const nextTheme = visibleTheme === "dark" ? "light" : "dark";
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        applyColorTheme(nextTheme);
        setTheme(nextTheme);
      }}
    >
      <Sun aria-hidden="true" />
      <Moon aria-hidden="true" />
    </button>
  );
}
