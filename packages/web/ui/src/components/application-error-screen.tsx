"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

import { Button } from "./button";

export interface ApplicationError {
  message?: string;
  digest?: string;
}

/** Full-page error presentation shared by product apps; route wrappers stay app-owned. */
export function ApplicationErrorScreen({
  error,
  reset,
  homeHref,
  homeLabel = "Go Home",
  description = "An unexpected error occurred. Please try again or go back to the home page.",
}: {
  error: ApplicationError;
  reset: () => void;
  homeHref?: string;
  homeLabel?: string;
  description?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-neutral-100 p-6 dark:bg-neutral-900 md:p-10">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-white p-6 shadow-sm dark:bg-neutral-800">
            <AlertCircle className="size-16 text-red-500" aria-hidden="true" />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Oops!
          </h1>
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
            Something went wrong
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset}>
            <RotateCcw className="mr-2 size-4" aria-hidden="true" />
            Try Again
          </Button>
          {homeHref ? (
            <Button type="button" variant="outline" asChild>
              <a href={homeHref}>
                <span className="sr-only">Navigate to </span>
                {homeLabel}
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
