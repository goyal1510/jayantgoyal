import type { Metadata } from "next";
import { ExternalLink, Github, Radio } from "lucide-react";
import { Badge } from "@jayantgoyal/web-ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";

import { SectionEditorialPanel } from "@/components/portfolio/section-editorial-panel";
import { PortfolioWorkspaceHeader } from "@/components/portfolio/portfolio-workspace-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadActivityWorkspace } from "@/lib/portfolio-workspace";
import { ActivitySourceForm } from "./activity-source-form";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const supabase = await createSupabaseServerClient();
  const { hero: heroRecord, editorial } = await loadActivityWorkspace(supabase);
  const githubUsername = heroRecord?.github_username ?? "";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <PortfolioWorkspaceHeader workspace="activity" />
      <SectionEditorialPanel sectionKey="activity" {...editorial} />
      <ActivitySourceForm initialData={heroRecord} />
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Portfolio workspace · live integration
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Activity</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              GitHub activity is collected from the public profile at render
              time. It is intentionally not duplicated as editable Portfolio
              content in the CMS.
            </p>
          </div>
          <Badge variant="outline" className="gap-2 px-3 py-1.5">
            <Radio className="size-3.5 text-emerald-500" />
            Live source
          </Badge>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-muted/30">
          <CardHeader>
            <Github className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">GitHub profile</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The public Portfolio reads the configured GitHub username from the
            canonical Hero record and requests activity through its own API.
            {githubUsername ? (
              <a
                href={`https://github.com/${githubUsername}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4"
              >
                @{githubUsername}
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardHeader>
            <Github className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">What is editable</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Edit the identity and links in Home and Contact. Keep GitHub metrics
            derived so the public surface stays trustworthy.
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardHeader>
            <ExternalLink className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Open source</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Verify the latest contribution history directly on the linked GitHub
            profile before publishing a content change.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
