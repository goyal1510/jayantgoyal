"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  // Using plain HTML/Tailwind only - no external components
  // This ensures the error page renders even if components fail
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 p-6 md:p-10">
      <div className="w-full max-w-md space-y-8">
        {/* Icon - using SVG directly */}
        <div className="flex justify-center">
          <div className="rounded-full bg-white dark:bg-neutral-800 p-6 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Oops!
          </h1>
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
            Something went wrong
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            An unexpected error occurred. Please try again or go back to the home page.
          </p>
        </div>

        {/* Actions - plain buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex cursor-pointer items-center justify-center rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-sm font-medium text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Try Again
          </button>
          <a
            href="/portfolio/hero"
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}
