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
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
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

  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillForm, setSkillForm] = useState<SkillFormData>(emptySkillForm);
  const [savingSkill, setSavingSkill] = useState(false);

  const [deleting, setDeleting] = useState<string | null>(null);

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
    setCategoryDialogOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCategory(true);

    try {
      if (editingCategory) {
        const result = await updatePortfolioData<SkillCategory>(
          "skill_categories",
          editingCategory.id,
          categoryForm,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Category updated");
      } else {
        const result = await createPortfolioData<SkillCategory>(
          "skill_categories",
          categoryForm,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Category added");
      }

      setCategoryDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save category",
      );
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
    if (!confirm("Are you sure you want to delete this category?")) return;

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
    setSkillDialogOpen(true);
  };

  const handleSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSkill(true);

    try {
      if (editingSkill) {
        const result = await updatePortfolioData<Skill>(
          "skills",
          editingSkill.id,
          skillForm,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Skill updated");
      } else {
        const result = await createPortfolioData<Skill>("skills", skillForm);
        if (result.error) throw new Error(result.error);
        toast.success("Skill added");
      }

      setSkillDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save skill",
      );
    } finally {
      setSavingSkill(false);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm("Are you sure you want to delete this skill?")) return;

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
      const result = await updatePortfolioData<Skill>("skills", skill.id, {
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
                  onDeleteCategory={handleDeleteCategory}
                  onAddSkill={openAddSkillDialog}
                  onEditSkill={openEditSkillDialog}
                  onDeleteSkill={handleDeleteSkill}
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
      />

      <SkillDialog
        open={skillDialogOpen}
        onOpenChange={setSkillDialogOpen}
        editing={editingSkill}
        formData={skillForm}
        setFormData={setSkillForm}
        onSubmit={handleSkillSubmit}
        saving={savingSkill}
      />
    </>
  );
}
