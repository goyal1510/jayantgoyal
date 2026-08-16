"use client";

import { useEffect, useState } from "react";

export function CursorOrbit() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const root = document.documentElement;
    const updatePointer = (event: PointerEvent) => {
      root.style.setProperty("--pointer-x", `${event.clientX}px`);
      root.style.setProperty("--pointer-y", `${event.clientY}px`);
    };
    const updateLabel = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      setLabel(
        target.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? "",
      );
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    document.addEventListener("pointerover", updateLabel, { passive: true });

    return () => {
      window.removeEventListener("pointermove", updatePointer);
      document.removeEventListener("pointerover", updateLabel);
    };
  }, []);

  return (
    <div className={`cursor-orbit${label ? " cursor-orbit--active" : ""}`}>
      <span>{label}</span>
    </div>
  );
}
