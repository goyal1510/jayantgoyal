import {
  Activity,
  BookOpen,
  BriefcaseBusiness,
  Code2,
  FolderKanban,
  Mail,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import type { PortfolioWorkspaceKey } from "@repo/portfolio-data";
import { WorkspaceHeader, type WorkspaceTone } from "@repo/ui/workspace-header";

const WORKSPACE_COPY: Record<
  PortfolioWorkspaceKey,
  {
    title: string;
    description: string;
    icon: LucideIcon;
    tone: WorkspaceTone;
    detail: string;
  }
> = {
  home: {
    title: "Home",
    description:
      "Shape the first impression: the name, point of view, availability, and invitation visitors meet before they explore the work.",
    icon: UserRound,
    tone: "lavender",
    detail: "Identity, hero story, resume, and search metadata",
  },
  about: {
    title: "About",
    description:
      "Keep the person and the foundation together—from the first sentence visitors read to the education timeline beneath it.",
    icon: UserRound,
    tone: "sage",
    detail: "Story, facts, principles, and education",
  },
  skills: {
    title: "Skills",
    description:
      "Describe the capabilities behind the work with honest proficiency, evidence, and a clear frontend-to-product shape.",
    icon: Code2,
    tone: "blue",
    detail: "Categories, working set, proficiency, and evidence",
  },
  experience: {
    title: "Experience",
    description:
      "Tell the career story through roles, outcomes, and credentials—not disconnected records or unexplained dates.",
    icon: BriefcaseBusiness,
    tone: "sand",
    detail: "Timeline, outcomes, credentials, and verification links",
  },
  activity: {
    title: "Activity",
    description:
      "Configure the source for live GitHub activity while keeping contribution data derived, current, and trustworthy.",
    icon: Activity,
    tone: "sage",
    detail: "GitHub identity and activity presentation",
  },
  work: {
    title: "Work",
    description:
      "Publish projects as complete stories with their screenshots, context, contribution, links, and accessible descriptions intact.",
    icon: FolderKanban,
    tone: "coral",
    detail: "Projects, full previews, links, and image context",
  },
  writing: {
    title: "Writing",
    description:
      "Draft, preview, and publish the thinking behind the work with the same structure visitors will read on the public site.",
    icon: BookOpen,
    tone: "blue",
    detail: "Notes, Markdown, publication state, and public preview",
  },
  contact: {
    title: "Contact",
    description:
      "Keep every response path clear: the public details, social links, availability context, and delivery expectations.",
    icon: Mail,
    tone: "sand",
    detail: "Email, location, social links, and response path",
  },
};

export function PortfolioWorkspaceHeader({
  workspace,
}: {
  workspace: PortfolioWorkspaceKey;
}) {
  const copy = WORKSPACE_COPY[workspace];

  return (
    <WorkspaceHeader
      icon={copy.icon}
      title={copy.title}
      description={copy.description}
      tone={copy.tone}
      details={
        <p className="text-sm font-medium opacity-75">{copy.detail}</p>
      }
    />
  );
}
