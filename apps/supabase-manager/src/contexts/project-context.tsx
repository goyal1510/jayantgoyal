"use client";

import * as React from "react";
import { ProjectId, PROJECTS, ProjectConfig } from "@/lib/projects";

interface ProjectContextType {
  selectedProject: ProjectConfig;
  setSelectedProject: (projectId: ProjectId) => void;
  projects: ProjectConfig[];
}

const ProjectContext = React.createContext<ProjectContextType | undefined>(
  undefined
);

const STORAGE_KEY = "supabase-manager-selected-project";

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [selectedProjectId, setSelectedProjectIdState] =
    React.useState<ProjectId>("jayantgoyal");

  // Load from localStorage on mount and sync cookie
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in PROJECTS) {
        setSelectedProjectIdState(stored as ProjectId);
        // Sync cookie
        document.cookie = `supabase-manager-selected-project=${stored}; path=/; max-age=31536000; SameSite=Lax`;
      } else {
        // Set default cookie
        document.cookie = `supabase-manager-selected-project=jayantgoyal; path=/; max-age=31536000; SameSite=Lax`;
      }
    }
  }, []);

  const setSelectedProject = React.useCallback((projectId: ProjectId) => {
    setSelectedProjectIdState(projectId);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, projectId);
      // Also set cookie for server-side access
      document.cookie = `supabase-manager-selected-project=${projectId}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  const selectedProject = PROJECTS[selectedProjectId];

  const value = React.useMemo(
    () => ({
      selectedProject,
      setSelectedProject,
      projects: Object.values(PROJECTS),
    }),
    [selectedProject, setSelectedProject]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProject() {
  const context = React.useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}

