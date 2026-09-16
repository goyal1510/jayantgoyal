"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "portfolio-color-theme";

type ColorTheme = "light" | "dark";

function applyColorTheme(theme: ColorTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ColorThemeToggle() {
  const [theme, setTheme] = useState<ColorTheme>("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      const nextTheme =
        storedTheme === "light" || storedTheme === "dark"
          ? storedTheme
          : mediaQuery.matches
            ? "dark"
            : "light";
      applyColorTheme(nextTheme);
      setTheme(nextTheme);
    };

    syncTheme();
    mediaQuery.addEventListener("change", syncTheme);
    return () => mediaQuery.removeEventListener("change", syncTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyColorTheme(nextTheme);
    setTheme(nextTheme);
  };

  const nextThemeLabel = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className={`color-theme-toggle${theme === "dark" ? " is-dark" : ""}`}
      aria-label={`Switch to ${nextThemeLabel} mode`}
      aria-pressed={theme === "dark"}
      title={`Switch to ${nextThemeLabel} mode`}
      onClick={toggleTheme}
    >
      <Sun aria-hidden="true" />
      <Moon aria-hidden="true" />
    </button>
  );
}
