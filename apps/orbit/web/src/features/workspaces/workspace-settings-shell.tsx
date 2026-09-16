"use client";

import { useState } from "react";

import { SettingsTabs } from "@/features/orbit/settings-tabs";
import { WorkspaceIntegrationsPanel } from "@/features/workspaces/workspace-integrations-panel";
import { WorkspaceSettingsPanel } from "@/features/workspaces/workspace-settings-panel";
import type { BoardTemplateSummary, MemberSummary, WorkspaceSummary } from "@/lib/orbit/types";

type WorkspaceSettingsShellProps = {
  workspace: WorkspaceSummary;
  members: MemberSummary[];
  templates: BoardTemplateSummary[];
  currentUserId: string;
  webhooks: Array<Record<string, unknown>>;
  tokens: Array<Record<string, unknown>>;
  aiEnabled: boolean;
};

export function WorkspaceSettingsShell(props: WorkspaceSettingsShellProps) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <SettingsTabs
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={[
        {
          id: "general",
          label: "General",
          content: (
            <WorkspaceSettingsPanel
              workspace={props.workspace}
              members={props.members}
              templates={props.templates}
              currentUserId={props.currentUserId}
            />
          ),
        },
        {
          id: "integrations",
          label: "Integrations",
          content: (
            <WorkspaceIntegrationsPanel
              workspaceId={props.workspace.id}
              webhooks={props.webhooks}
              tokens={props.tokens}
              aiEnabled={props.aiEnabled}
            />
          ),
        },
      ]}
    />
  );
}
