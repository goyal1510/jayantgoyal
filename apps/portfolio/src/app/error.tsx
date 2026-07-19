"use client";

import { EditorialButton } from "@/components/editorial/editorial-button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold tracking-[0.2em] text-destructive uppercase">
        Something went wrong
      </p>
      <h1 className="mt-3 text-3xl font-bold">The page could not load</h1>
      <p className="mt-3 text-muted-foreground">
        Try the request again. If the problem continues, the Portfolio home
        remains available.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <EditorialButton onClick={reset}>
          Try again
        </EditorialButton>
        <EditorialButton href="/">Return to Portfolio</EditorialButton>
      </div>
    </div>
  );
}
