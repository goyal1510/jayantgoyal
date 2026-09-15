import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { EditorialReveal } from "@/components/editorial/editorial-reveal";
import { GithubCodeStats } from "@/components/editorial/github-code-stats";
import { GithubContributions } from "@/components/editorial/github-contributions";
import type {
  PortfolioProfile,
  PortfolioSectionContent,
} from "@/lib/portfolio/editorial-data";

export function GithubActivity({
  profile,
  content,
}: {
  profile: PortfolioProfile;
  content: PortfolioSectionContent;
}) {
  return (
    <section id="activity" className="github-activity">
      <div className="shell">
        <EditorialReveal className="section-heading github-activity__heading">
          <span className="section-index">Activity</span>
          <div>
            <h2>GitHub Activity</h2>
            <p>{content.description}</p>
            <Link
              className="text-link github-activity__analytics-link"
              href="/analytics"
            >
              Live site analytics <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </EditorialReveal>

        <EditorialReveal className="github-activity__ledger">
          <GithubContributions
            username={profile.githubUsername}
            profileUrl={profile.github}
            profileLabel={profile.github.replace(/^https?:\/\//, "")}
          />
          <GithubCodeStats username={profile.githubUsername} />
        </EditorialReveal>
      </div>
    </section>
  );
}
