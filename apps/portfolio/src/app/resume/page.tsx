import type { Metadata } from "next";
import Link from "next/link";

import { ArrowDownToLine, ArrowUpRight } from "lucide-react";

import { EditorialSubpageHeader } from "@/components/editorial/subpage-header";
import { buildPublicPageMetadata } from "@/lib/seo/config";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Resume",
  description:
    "View or download Jayant Goyal's current full-stack product engineering resume.",
  pathname: "/resume",
});

export default function ResumePage() {
  return (
    <main className="editorial-page">
      <EditorialSubpageHeader />
      <section className="shell editorial-resume">
        <span className="section-index">Resume / Current snapshot</span>
        <div>
          <h1>The concise version of the path so far.</h1>
          <p>
            Product engineering across interfaces, application systems, data,
            and delivery—along with the experience and education behind the
            work.
          </p>
          <div className="editorial-resume__actions">
            <a href="/api/resume">
              Download latest resume <ArrowDownToLine aria-hidden="true" />
            </a>
            <Link href="/#experience">
              Explore the full story <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
