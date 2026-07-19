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
import { IconAction } from "@repo/ui/icon-action";
import { VisibilityBadge } from "@repo/ui/status-badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/collapsible";
import type {
  SkillCategoryWithSkills,
  SkillCategory,
  Skill,
} from "@/lib/types";

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
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                expanded ? "Collapse skill category" : "Expand skill category"
              }
              title={
                expanded ? "Collapse skill category" : "Expand skill category"
              }
            >
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
              <VisibilityBadge visible={category.is_visible} />
            </div>
            <p className="text-sm text-muted-foreground">
              {category.description}
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
            <IconAction
              icon={Pencil}
              label="Edit skill category"
              variant="ghost"
              onClick={() => onEditCategory(category)}
            />
            <IconAction
              icon={deleting === category.id ? Loader2 : Trash2}
              iconClassName={
                deleting === category.id ? "size-4 animate-spin" : undefined
              }
              label="Delete skill category"
              variant="ghost"
              onClick={() => onDeleteCategory(category.id)}
              disabled={deleting === category.id}
            />
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
                    <span className="ml-2 text-xs uppercase tracking-wide text-muted-foreground">
                      {skill.proficiency}
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {skill.evidence}
                    </p>
                    <VisibilityBadge
                      visible={skill.is_visible}
                      className="ml-2"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <IconAction
                      icon={skill.is_visible ? Eye : EyeOff}
                      label={skill.is_visible ? "Hide skill" : "Show skill"}
                      variant="ghost"
                      onClick={() => onToggleSkillVisibility(skill)}
                    />
                    <IconAction
                      icon={Pencil}
                      label="Edit skill"
                      variant="ghost"
                      onClick={() => onEditSkill(skill)}
                    />
                    <IconAction
                      icon={deleting === skill.id ? Loader2 : Trash2}
                      iconClassName={
                        deleting === skill.id
                          ? "size-4 animate-spin"
                          : undefined
                      }
                      label="Delete skill"
                      variant="ghost"
                      onClick={() => onDeleteSkill(skill.id)}
                      disabled={deleting === skill.id}
                    />
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
