"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { WorkspaceHeader } from "@jayantgoyal/web-ui/workspace-header";
import { ToolFavoriteButton } from "@/components/tools/tool-favorite-button";
import { getToolTone } from "@/lib/tools/tool-tones";
import {
  allTools,
  getToolByPath,
  getToolCategoryByPath,
} from "@/lib/tools/tools";

interface ToolUsageShellProps {
  children: ReactNode;
}

export function ToolUsageShell({ children }: ToolUsageShellProps) {
  const pathname = usePathname();
  const tool = getToolByPath(pathname);
  const category = getToolCategoryByPath(pathname);

  if (!tool || !category) {
    return <>{children}</>;
  }

  const catalogIndex = allTools.findIndex(
    (candidate) => candidate.id === tool.id,
  );
  const tone = getToolTone(tool.id, Math.max(catalogIndex, 0));

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        icon={tool.icon}
        title={tool.title}
        description={tool.description}
        toneClassName={tone}
        actions={
          <ToolFavoriteButton
            toolId={tool.id}
            size="default"
            variant="ghost"
            className="h-11 rounded-xl border border-current/20 bg-white/20 px-5 text-current shadow-none hover:bg-white/35 hover:text-current dark:bg-black/10 dark:hover:bg-black/20"
          />
        }
      />

      {children}
    </div>
  );
}
