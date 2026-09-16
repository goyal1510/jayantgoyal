"use client";

import { useState } from "react";

import { BoardP2Panel } from "@/features/boards/board-p2-panel";
import { BoardSettingsPanel } from "@/features/boards/board-settings-panel";
import { SettingsTabs } from "@/features/orbit/settings-tabs";
import type {
  AutomationRuleSummary,
  BoardSummary,
  ColumnSummary,
  LabelSummary,
  PublishedBoardSummary,
} from "@/lib/orbit/types";

type BoardSettingsShellProps = {
  board: BoardSummary;
  columns: ColumnSummary[];
  labels: LabelSummary[];
  automationRules: AutomationRuleSummary[];
  publishedBoard: PublishedBoardSummary | null;
  reports: {
    completion: Record<string, unknown>;
    backlog: Record<string, unknown>;
    staleCards: Array<Record<string, unknown>>;
  };
};

export function BoardSettingsShell(props: BoardSettingsShellProps) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <SettingsTabs
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={[
        {
          id: "general",
          label: "General",
          content: <BoardSettingsPanel board={props.board} columns={props.columns} />,
        },
        {
          id: "automation",
          label: "Automation",
          content: (
            <BoardP2Panel
              boardId={props.board.id}
              columns={props.columns}
              labels={props.labels}
              automationRules={props.automationRules}
              publishedBoard={props.publishedBoard}
              reports={props.reports}
              mode="automation"
            />
          ),
        },
        {
          id: "reports",
          label: "Reports",
          content: (
            <BoardP2Panel
              boardId={props.board.id}
              columns={props.columns}
              labels={props.labels}
              automationRules={props.automationRules}
              publishedBoard={props.publishedBoard}
              reports={props.reports}
              mode="reports"
            />
          ),
        },
        {
          id: "publish",
          label: "Publish & import",
          content: (
            <BoardP2Panel
              boardId={props.board.id}
              columns={props.columns}
              labels={props.labels}
              automationRules={props.automationRules}
              publishedBoard={props.publishedBoard}
              reports={props.reports}
              mode="publish"
            />
          ),
        },
      ]}
    />
  );
}
