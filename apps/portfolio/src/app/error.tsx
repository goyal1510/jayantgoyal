"use client";

import Link from "next/link";

import { Button } from "@repo/ui/button";

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
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Return to Portfolio</Link>
        </Button>
      </div>
    </div>
  );
}
