"use client";

import { ApplicationErrorScreen } from "@jayant/web-ui/application-error-screen";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <ApplicationErrorScreen error={error} reset={reset} />
      </body>
    </html>
  );
}
