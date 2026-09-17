"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import { useHasHydrated } from "./use-has-hydrated";

const SHOW_BUTTON_AFTER_PX = 480;

export function ScrollToTop() {
  const hasHydrated = useHasHydrated();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(window.scrollY > SHOW_BUTTON_AFTER_PX);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const showButton = hasHydrated && visible;

  return (
    <button
      type="button"
      className={`scroll-to-top${showButton ? " is-visible" : ""}`}
      aria-label="Scroll to top"
      tabIndex={showButton ? 0 : -1}
      suppressHydrationWarning
      onClick={scrollToTop}
    >
      <ArrowUp aria-hidden="true" />
      <span aria-hidden="true">Scroll To Top</span>
    </button>
  );
}
