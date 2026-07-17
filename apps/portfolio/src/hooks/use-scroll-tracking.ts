"use client";

import { useEffect, useState } from "react";

export function useScrollTracking(sectionIds: string[], enabled: boolean) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? "home");

  useEffect(() => {
    if (!enabled || sectionIds.length === 0) return;

    let frame: number | undefined;

    const updateActiveSection = () => {
      const threshold = window.innerHeight * 0.3;
      let current = sectionIds[0] ?? "home";

      for (const id of sectionIds) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= threshold) {
          current = id;
        }
      }

      const atPageEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 50;
      if (atPageEnd) current = sectionIds.at(-1) ?? current;

      setActiveSection(current);
    };

    const scheduleUpdate = () => {
      if (frame !== undefined) return;
      frame = window.requestAnimationFrame(() => {
        updateActiveSection();
        frame = undefined;
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [enabled, sectionIds]);

  return activeSection;
}
