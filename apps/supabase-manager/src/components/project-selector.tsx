"use client";

import * as React from "react";
import { ChevronDown, Database } from "lucide-react";
import { useProject } from "@/contexts/project-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ProjectSelector() {
  const { selectedProject, setSelectedProject, projects } = useProject();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Database className="h-4 w-4" />
          <span className="hidden sm:inline">{selectedProject.name}</span>
          <span className="sm:hidden">{selectedProject.name.split(" ")[0]}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => setSelectedProject(project.id)}
            className={
              selectedProject.id === project.id
                ? "bg-accent font-medium"
                : ""
            }
          >
            {project.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

