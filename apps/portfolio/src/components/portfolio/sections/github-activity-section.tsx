"use client";

import { Separator } from "@repo/ui/separator";
import { cn } from "@repo/ui/lib/utils";
import { GithubCalendarComponent } from "@/components/portfolio/github-calendar";
import {
  sectionScrollMargin,
  SectionHeader,
} from "@/components/portfolio/shared";

export function GithubActivitySection({
  githubUsername,
  githubUrl,
}: {
  githubUsername: string;
  githubUrl: string | undefined;
}) {
  return (
    <section
      id="github-activity"
      className={cn("px-4 sm:px-6 lg:px-8", sectionScrollMargin)}
    >
      <SectionHeader
        title="Development Activity"
        description="Consistent daily coding and open source contributions"
      />
      <Separator className="my-8" />
      <div className="mx-auto">
        <GithubCalendarComponent
          username={githubUsername}
          githubUrl={githubUrl}
        />
      </div>
    </section>
  );
}
