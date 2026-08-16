"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { calculateScrollProgress } from "@/lib/portfolio/scroll-progress";

export function PageScrollProgress() {
  const pathname = usePathname();
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frameId: number | null = null;

    const updateProgress = () => {
      frameId = null;
      const root = document.documentElement;
      const progress = calculateScrollProgress(
        window.scrollY,
        root.scrollHeight,
        root.clientHeight,
      );

      progressRef.current?.style.setProperty(
        "--scroll-progress-scale",
        String(progress),
      );
    };

    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(updateProgress);
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleUpdate);

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    resizeObserver?.observe(document.body);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver?.disconnect();
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [pathname]);

  return (
    <div ref={progressRef} className="scroll-progress" aria-hidden="true" />
  );
}
