"use client";

import * as React from "react";
import type { ComponentProps } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

function MigrateSystemPreference() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    if (theme === "system") {
      setTheme(resolvedTheme === "dark" ? "dark" : "light");
    }
  }, [resolvedTheme, setTheme, theme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      {...props}
      defaultTheme="light"
      enableSystem={false}
      themes={["light", "dark"]}
    >
      <MigrateSystemPreference />
      {children}
    </NextThemesProvider>
  );
}
