"use client";

import { ApplicationErrorScreen } from "@jayant/web-ui/application-error-screen";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ApplicationErrorScreen
      error={error}
      reset={reset}
      homeHref="/portfolio/home"
    />
  );
}
