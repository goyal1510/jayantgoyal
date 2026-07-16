import type { Metadata } from "next";
import Link from "next/link";

import { Download, ExternalLink } from "lucide-react";

import { Button } from "@repo/ui/button";

import { buildPublicPageMetadata } from "@/lib/seo/config";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Resume",
  description:
    "View or download Jayant Goyal's current full-stack development resume.",
  pathname: "/resume",
});

export default function ResumePage() {
  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-3xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">
          Experience snapshot
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Resume
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
          Download the latest resume, or return to the Portfolio to explore
          projects, experience, and technical skills in context.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href="/api/resume">
              <Download className="size-4" />
              Download resume
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/#experience">
              <ExternalLink className="size-4" />
              View experience
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
