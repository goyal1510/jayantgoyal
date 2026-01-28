"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import {
  createPortfolioData,
  updatePortfolioData,
  deletePortfolioData,
} from "@/lib/portfolio-api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { SkillCategoryWithSkills, SkillCategory, Skill } from "@/lib/types";

interface SkillsManagerProps {
  initialData: SkillCategoryWithSkills[];
}

type CategoryFormData = Omit<SkillCategory, "id" | "created_at" | "updated_at">;
type SkillFormData = Omit<Skill, "id" | "created_at" | "updated_at">;

const emptyCategoryForm: CategoryFormData = {
  title: "",
  icon_key: "",
  color: "",
  sort_order: 0,
  is_visible: true,
};

const emptySkillForm: SkillFormData = {
  category_id: "",
  name: "",
  level: null,
  sort_order: 0,
  is_visible: true,
};

export function SkillsManager({ initialData }: SkillsManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialData);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(initialData.map((c) => c.id))
  );

  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(emptyCategoryForm);
  const [savingCategory, setSavingCategory] = useState(false);

  // Skill dialog state
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillForm, setSkillForm] = useState<SkillFormData>(emptySkillForm);
  const [savingSkill, setSavingSkill] = useState(false);

  const [deleting, setDeleting] = useState<string | null>(null);

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  // Category handlers
  const openAddCategoryDialog = () => {
    setEditingCategory(null);
    setCategoryForm({
      ...emptyCategoryForm,
      sort_order: categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 0,
    });
    setCategoryDialogOpen(true);
  };

  const openEditCategoryDialog = (category: SkillCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      title: category.title,
      icon_key: category.icon_key,
      color: category.color ?? "",
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
          categoryForm
        );
        if (result.error) throw new Error(result.error);
        toast.success("Category updated");
      } else {
        const result = await createPortfolioData<SkillCategory>(
          "skill_categories",
          categoryForm
        );
        if (result.error) throw new Error(result.error);
        toast.success("Category added");
      }

      setCategoryDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save category"
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
        error instanceof Error ? error.message : "Failed to delete category"
      );
    } finally {
      setDeleting(null);
    }
  };

  // Skill handlers
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
      level: skill.level,
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
          skillForm
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
        error instanceof Error ? error.message : "Failed to save skill"
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
        }))
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete skill"
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
            s.id === skill.id ? { ...s, is_visible: !s.is_visible } : s
          ),
        }))
      );
      toast.success(skill.is_visible ? "Skill hidden" : "Skill visible");
    } catch (error) {
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
                <Collapsible
                  key={category.id}
                  open={expandedCategories.has(category.id)}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <div className="rounded-lg border">
                    <div className="flex items-center gap-4 p-4">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon">
                          {expandedCategories.has(category.id) ? (
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
                          onClick={() => openAddSkillDialog(category.id)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Skill
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditCategoryDialog(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id)}
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
                                  onClick={() => toggleSkillVisibility(skill)}
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
                                  onClick={() => openEditSkillDialog(skill)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSkill(skill.id)}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the skill category details."
                : "Add a new skill category to organize your skills."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cat-title">Title</Label>
                <Input
                  id="cat-title"
                  value={categoryForm.title}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, title: e.target.value })
                  }
                  placeholder="Frontend Development"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cat-icon">Icon Key</Label>
                  <Input
                    id="cat-icon"
                    value={categoryForm.icon_key}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, icon_key: e.target.value })
                    }
                    placeholder="Code2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-color">Color</Label>
                  <Input
                    id="cat-color"
                    value={categoryForm.color ?? ""}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, color: e.target.value })
                    }
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-sort">Sort Order</Label>
                <Input
                  id="cat-sort"
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      sort_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="cat-visible"
                  checked={categoryForm.is_visible}
                  onCheckedChange={(checked) =>
                    setCategoryForm({ ...categoryForm, is_visible: checked })
                  }
                />
                <Label htmlFor="cat-visible">Visible on portfolio</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingCategory}>
                {savingCategory && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingCategory ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Skill Dialog */}
      <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSkill ? "Edit Skill" : "Add Skill"}
            </DialogTitle>
            <DialogDescription>
              {editingSkill
                ? "Update the skill details."
                : "Add a new skill to this category."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSkillSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="skill-name">Skill Name</Label>
                <Input
                  id="skill-name"
                  value={skillForm.name}
                  onChange={(e) =>
                    setSkillForm({ ...skillForm, name: e.target.value })
                  }
                  placeholder="React"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="skill-level">Level (0-100)</Label>
                  <Input
                    id="skill-level"
                    type="number"
                    min="0"
                    max="100"
                    value={skillForm.level ?? ""}
                    onChange={(e) =>
                      setSkillForm({
                        ...skillForm,
                        level: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="85"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skill-sort">Sort Order</Label>
                  <Input
                    id="skill-sort"
                    type="number"
                    value={skillForm.sort_order}
                    onChange={(e) =>
                      setSkillForm({
                        ...skillForm,
                        sort_order: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="skill-visible"
                  checked={skillForm.is_visible}
                  onCheckedChange={(checked) =>
                    setSkillForm({ ...skillForm, is_visible: checked })
                  }
                />
                <Label htmlFor="skill-visible">Visible on portfolio</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSkillDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingSkill}>
                {savingSkill && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingSkill ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
