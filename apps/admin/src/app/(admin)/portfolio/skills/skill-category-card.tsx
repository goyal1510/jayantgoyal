"use client";

import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/collapsible";
import type { SkillCategoryWithSkills, SkillCategory, Skill } from "@/lib/types";

interface SkillCategoryCardProps {
  category: SkillCategoryWithSkills;
  expanded: boolean;
  onToggle: () => void;
  onEditCategory: (category: SkillCategory) => void;
  onDeleteCategory: (id: string) => void;
  onAddSkill: (categoryId: string) => void;
  onEditSkill: (skill: Skill) => void;
  onDeleteSkill: (id: string) => void;
  onToggleSkillVisibility: (skill: Skill) => void;
  deleting: string | null;
}

export function SkillCategoryCard({
  category,
  expanded,
  onToggle,
  onEditCategory,
  onDeleteCategory,
  onAddSkill,
  onEditSkill,
  onDeleteSkill,
  onToggleSkillVisibility,
  deleting,
}: SkillCategoryCardProps) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div className="rounded-lg border">
        <div className="flex items-center gap-4 p-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon">
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{category.title}</h3>
              <span className="text-xs text-muted-foreground">
                ({category.skills.length} skills)
              </span>
              {!category.is_visible && (
                <span className="text-xs text-muted-foreground">
                  (Hidden)
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Icon: {category.icon_key || "None"}{" "}
              {category.color && `• Color: ${category.color}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddSkill(category.id)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Skill
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEditCategory(category)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteCategory(category.id)}
              disabled={deleting === category.id}
            >
              {deleting === category.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <CollapsibleContent>
          <div className="border-t px-4 py-2 space-y-2 bg-muted/50">
            {category.skills.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No skills in this category
              </p>
            ) : (
              category.skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center gap-4 rounded border bg-background p-3"
                >
                  <div className="flex-1">
                    <span className="font-medium">{skill.name}</span>
                    {skill.level !== null && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        Level: {skill.level}%
                      </span>
                    )}
                    {!skill.is_visible && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Hidden)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleSkillVisibility(skill)}
                    >
                      {skill.is_visible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditSkill(skill)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteSkill(skill.id)}
                      disabled={deleting === skill.id}
                    >
                      {deleting === skill.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
