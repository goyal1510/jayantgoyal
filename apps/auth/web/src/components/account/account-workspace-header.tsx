import {
  KeyRound,
  LayoutDashboard,
  Link2,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { WorkspaceHeader, type WorkspaceTone } from "@jayant/web-ui/workspace-header";

type AccountWorkspaceKey =
  | "security"
  | "profile"
  | "password"
  | "mfa"
  | "providers";

const WORKSPACE_COPY: Record<
  AccountWorkspaceKey,
  {
    title: string;
    description: string;
    detail: string;
    icon: LucideIcon;
    tone: WorkspaceTone;
  }
> = {
  security: {
    title: "Account security",
    description:
      "A clear home for your identity, password, and second factor across every Jayant workspace.",
    detail: "One account · one security posture · no provider clutter",
    icon: LayoutDashboard,
    tone: "lavender",
  },
  profile: {
    title: "Profile",
    description:
      "Keep the name shown across Studio and Admin current without changing your sign-in details.",
    detail: "Identity details used across the platform",
    icon: UserRound,
    tone: "sage",
  },
  password: {
    title: "Password",
    description:
      "Change the password protecting this account after confirming the current one.",
    detail: "Use a unique password with strong recovery protection",
    icon: KeyRound,
    tone: "sand",
  },
  mfa: {
    title: "Multi-factor authentication",
    description:
      "Add an authenticator app so a password alone is never the only key to your account.",
    detail: "Time-based codes · verified before recovery changes",
    icon: ShieldCheck,
    tone: "blue",
  },
  providers: {
    title: "Connected providers",
    description:
      "Manage the Google, GitHub, and other sign-in methods attached to this account.",
    detail: "Keep more than one trusted way back into your account",
    icon: Link2,
    tone: "sand",
  },
};

export function AccountWorkspaceHeader({
  workspace,
}: {
  workspace: AccountWorkspaceKey;
}) {
  const copy = WORKSPACE_COPY[workspace];

  return (
    <WorkspaceHeader
      icon={copy.icon}
      title={copy.title}
      description={copy.description}
      tone={copy.tone}
      details={<p className="text-sm font-medium opacity-75">{copy.detail}</p>}
    />
  );
}
