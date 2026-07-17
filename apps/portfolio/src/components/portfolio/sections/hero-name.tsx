"use client";

import { useState, useEffect } from "react";
import FlipText from "@/components/ui/flip-text";

export function HeroName({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Before hydration: plain text (server HTML, instant LCP)
  // After hydration: FlipText animation takes over
  if (!hydrated) {
    return <span className={className}>{name}</span>;
  }

  return (
    <FlipText className={className} duration={3}>
      {name}
    </FlipText>
  );
}
