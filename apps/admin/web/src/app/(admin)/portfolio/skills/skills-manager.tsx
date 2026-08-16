"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  createPortfolioData,
  updatePortfolioData,
  deletePortfolioData,
} from "@/lib/portfolio-api";
import { Button } from "@jayantgoyal/web-ui/button";
import { ConfirmationDialog } from "@jayantgoyal/web-ui/confirmation-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";
import type {
  SkillCategoryWithSkills,
  SkillCategory,
  Skill,
} from "@/lib/types";
import {
  CategoryDialog,
  emptyCategoryForm,
  type CategoryFormData,
} from "./category-dialog";
import {
  SkillDialog,
  emptySkillForm,
  type SkillFormData,
} from "./skill-dialog";
import { SkillCategoryCard } from "./skill-category-card";

interface SkillsManagerProps {
  initialData: SkillCategoryWithSkills[];
}

export function SkillsManager({ initialData }: SkillsManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialData);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(initialData.map((c) => c.id)),
  );

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(
    null,
  );
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormData>(emptyCategoryForm);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState<string | null>(
    null,
  );

  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillForm, setSkillForm] = useState<SkillFormData>(emptySkillForm);
  const [savingSkill, setSavingSkill] = useState(false);
  const [skillFormError, setSkillFormError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: "category"; item: SkillCategory }
    | { kind: "skill"; item: Skill }
    | null
  >(null);

  useEffect(() => {
    setCategories(initialData);
  }, [initialData]);

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const openAddCategoryDialog = () => {
    setEditingCategory(null);
    setCategoryForm({
      ...emptyCategoryForm,
      sort_order:
        categories.length > 0
          ? Math.max(...categories.map((c) => c.sort_order)) + 1
          : 0,
    });
    setCategoryFormError(null);
    setCategoryDialogOpen(true);
  };

  const openEditCategoryDialog = (category: SkillCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      title: category.title,
      description: category.description,
      sort_order: category.sort_order,
      is_visible: category.is_visible,
    });
    setCategoryFormError(null);
    setCategoryDialogOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCategory(true);
    setCategoryFormError(null);

    try {
      if (editingCategory) {
        const result = await updatePortfolioData(
          "skill_categories",
          editingCategory.id,
          categoryForm,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Category updated");
      } else {
        const result = await createPortfolioData(
          "skill_categories",
          categoryForm,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Category added");
      }

      setCategoryDialogOpen(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save category";
      setCategoryFormError(message);
      toast.error(message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (category && category.skills.length > 0) {
      toast.error("Delete all skills in this category first");
      return;
    }
    setDeleting(id);

    try {
      const result = await deletePortfolioData("skill_categories", id);
      if (result.error) throw new Error(result.error);
      toast.success("Category deleted");
      setCategories(categories.filter((c) => c.id !== id));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category",
      );
    } finally {
      setDeleting(null);
    }
  };

  const openAddSkillDialog = (categoryId: string) => {
    setEditingSkill(null);
    const category = categories.find((c) => c.id === categoryId);
    setSkillForm({
      ...emptySkillForm,
      category_id: categoryId,
      sort_order: category?.skills.length ?? 0,
    });
    setSkillFormError(null);
    setSkillDialogOpen(true);
  };

  const openEditSkillDialog = (skill: Skill) => {
    setEditingSkill(skill);
    setSkillForm({
      category_id: skill.category_id,
      name: skill.name,
      proficiency: skill.proficiency,
      evidence: skill.evidence,
      sort_order: skill.sort_order,
      is_visible: skill.is_visible,
    });
    setSkillFormError(null);
    setSkillDialogOpen(true);
  };

  const handleSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSkill(true);
    setSkillFormError(null);

    try {
      if (editingSkill) {
        const result = await updatePortfolioData(
          "skills",
          editingSkill.id,
          skillForm,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Skill updated");
      } else {
        const result = await createPortfolioData("skills", skillForm);
        if (result.error) throw new Error(result.error);
        toast.success("Skill added");
      }

      setSkillDialogOpen(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save skill";
      setSkillFormError(message);
      toast.error(message);
    } finally {
      setSavingSkill(false);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    setDeleting(id);

    try {
      const result = await deletePortfolioData("skills", id);
      if (result.error) throw new Error(result.error);
      toast.success("Skill deleted");
      setCategories(
        categories.map((c) => ({
          ...c,
          skills: c.skills.filter((s) => s.id !== id),
        })),
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete skill",
      );
    } finally {
      setDeleting(null);
    }
  };

  const toggleSkillVisibility = async (skill: Skill) => {
    try {
      const result = await updatePortfolioData("skills", skill.id, {
        is_visible: !skill.is_visible,
      });
      if (result.error) throw new Error(result.error);
      setCategories(
        categories.map((c) => ({
          ...c,
          skills: c.skills.map((s) =>
            s.id === skill.id ? { ...s, is_visible: !s.is_visible } : s,
          ),
        })),
      );
      toast.success(skill.is_visible ? "Skill hidden" : "Skill visible");
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Skill Categories</CardTitle>
            <CardDescription>
              Organize your skills into categories.
            </CardDescription>
          </div>
          <Button onClick={openAddCategoryDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No skill categories yet. Click &quot;Add Category&quot; to get
              started.
            </p>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <SkillCategoryCard
                  key={category.id}
                  category={category}
                  expanded={expandedCategories.has(category.id)}
                  onToggle={() => toggleCategory(category.id)}
                  onEditCategory={openEditCategoryDialog}
                  onDeleteCategory={(id) => {
                    const item = categories.find(
                      (category) => category.id === id,
                    );
                    if (item) setPendingDelete({ kind: "category", item });
                  }}
                  onAddSkill={openAddSkillDialog}
                  onEditSkill={openEditSkillDialog}
                  onDeleteSkill={(id) => {
                    const item = categories
                      .flatMap((category) => category.skills)
                      .find((skill) => skill.id === id);
                    if (item) setPendingDelete({ kind: "skill", item });
                  }}
                  onToggleSkillVisibility={toggleSkillVisibility}
                  deleting={deleting}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        editing={editingCategory}
        formData={categoryForm}
        setFormData={setCategoryForm}
        onSubmit={handleCategorySubmit}
        saving={savingCategory}
        errorMessage={categoryFormError}
      />

      <SkillDialog
        open={skillDialogOpen}
        onOpenChange={setSkillDialogOpen}
        editing={editingSkill}
        formData={skillForm}
        setFormData={setSkillForm}
        onSubmit={handleSkillSubmit}
        saving={savingSkill}
        errorMessage={skillFormError}
      />
      <ConfirmationDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete?.kind === "category"
            ? "Delete this skill category?"
            : "Delete this skill?"
        }
        description={
          pendingDelete?.kind === "category"
            ? "This removes the empty category from the Skills workspace."
            : "This removes the skill from the public Skills section."
        }
        confirmLabel={
          pendingDelete?.kind === "category"
            ? "Delete category"
            : "Delete skill"
        }
        destructive
        onConfirm={() => {
          if (!pendingDelete) return;
          return pendingDelete.kind === "category"
            ? handleDeleteCategory(pendingDelete.item.id)
            : handleDeleteSkill(pendingDelete.item.id);
        }}
      />
    </>
  );
}
