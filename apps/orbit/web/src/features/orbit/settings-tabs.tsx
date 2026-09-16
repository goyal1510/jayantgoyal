"use client";

import type { ReactNode } from "react";

import { cn } from "@jayantgoyal/web-ui/lib/utils";

export type SettingsTab = {
  id: string;
  label: string;
  content: ReactNode;
};

type SettingsTabsProps = {
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

export function SettingsTabs({ tabs, activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/20 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition",
              activeTab === tab.id
                ? "bg-background font-medium text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
    </div>
  );
}
