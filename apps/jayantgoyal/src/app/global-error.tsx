"use client"

import { AlertCircle, RotateCcw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-svh flex-col items-center justify-center bg-neutral-100 p-6 md:p-10">
          <div className="w-full max-w-md space-y-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-white p-6 shadow-sm">
                <AlertCircle className="size-16 text-red-500" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-neutral-900">Oops!</h1>
              <h2 className="text-xl font-semibold text-neutral-800">Something went wrong</h2>
              <p className="text-sm text-neutral-600">
                A critical error occurred. Please try again.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-center">
              <button
                onClick={() => reset()}
                className="inline-flex items-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                <RotateCcw className="mr-2 size-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
