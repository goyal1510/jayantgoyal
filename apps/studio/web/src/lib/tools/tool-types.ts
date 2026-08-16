import type { ComponentType } from "react";

export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  path: string;
}

export interface ToolCategory {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  tools: Tool[];
}
