"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Plus, X } from "lucide-react";
import { createPortfolioData, updatePortfolioData } from "@/lib/portfolio-api";
import { Button } from "@repo/ui/button";
import { FormMessage } from "@repo/ui/form-message";
import { IconAction } from "@repo/ui/icon-action";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import type { About, PersonalInfo, PortfolioPrinciple } from "@/lib/types";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";

interface AboutFormProps {
  initialData: About | null;
}

export function AboutForm({ initialData }: AboutFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    summary: initialData?.summary ?? "",
    headline: initialData?.headline ?? "",
    objective: initialData?.objective ?? "",
    story: initialData?.story ?? ([] as string[]),
    principles: initialData?.principles ?? ([] as PortfolioPrinciple[]),
    personal: initialData?.personal ?? ([] as PersonalInfo[]),
  });
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({
      summary: initialData?.summary ?? "",
      headline: initialData?.headline ?? "",
      objective: initialData?.objective ?? "",
      story: initialData?.story ?? [],
      principles: initialData?.principles ?? [],
      personal: initialData?.personal ?? [],
    }),
  );
  const isDirty = JSON.stringify(formData) !== savedSnapshot;
  useUnsavedChangesGuard(isDirty && !saving);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      if (initialData?.id) {
        const result = await updatePortfolioData(
          "about",
          initialData.id,
          formData,
        );
        if (result.error) throw new Error(result.error);
        toast.success("About section updated");
      } else {
        const result = await createPortfolioData("about", formData);
        if (result.error) throw new Error(result.error);
        toast.success("About section created");
      }

      setSavedSnapshot(JSON.stringify(formData));
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save about section";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const addPersonalInfo = () => {
    setFormData({
      ...formData,
      personal: [...formData.personal, { label: "", value: "" }],
    });
  };

  const removePersonalInfo = (index: number) => {
    setFormData({
      ...formData,
      personal: formData.personal.filter((_, i) => i !== index),
    });
  };

  const updatePersonalInfo = (
    index: number,
    field: keyof PersonalInfo,
    value: string,
  ) => {
    const updated = [...formData.personal];
    const currentItem = updated[index];
    if (!currentItem) return;
    updated[index] = {
      label: field === "label" ? value : currentItem.label,
      value: field === "value" ? value : currentItem.value,
    };
    setFormData({ ...formData, personal: updated });
  };

  const addStoryParagraph = () => {
    setFormData({ ...formData, story: [...formData.story, ""] });
  };

  const updateStoryParagraph = (index: number, value: string) => {
    const story = [...formData.story];
    story[index] = value;
    setFormData({ ...formData, story });
  };

  const removeStoryParagraph = (index: number) => {
    setFormData({
      ...formData,
      story: formData.story.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  const addPrinciple = () => {
    setFormData({
      ...formData,
      principles: [...formData.principles, { title: "", copy: "" }],
    });
  };

  const updatePrinciple = (
    index: number,
    field: keyof PortfolioPrinciple,
    value: string,
  ) => {
    const principles = [...formData.principles];
    const current = principles[index];
    if (!current) return;
    principles[index] = { ...current, [field]: value };
    setFormData({ ...formData, principles });
  };

  const removePrinciple = (index: number) => {
    setFormData({
      ...formData,
      principles: formData.principles.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            A brief introduction about yourself.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="headline">Section Headline</Label>
            <Input
              id="headline"
              value={formData.headline}
              onChange={(e) =>
                setFormData({ ...formData, headline: e.target.value })
              }
              placeholder="I like the whole problem, not only the screen."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="objective">Career Objective</Label>
            <Textarea
              id="objective"
              value={formData.objective}
              onChange={(e) =>
                setFormData({ ...formData, objective: e.target.value })
              }
              placeholder="Describe the work you want to do and how you approach it."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">About Summary</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) =>
                setFormData({ ...formData, summary: e.target.value })
              }
              placeholder="Write a brief summary about yourself..."
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Story</CardTitle>
          <CardDescription>
            The longer narrative shown beside the profile facts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.story.map((paragraph, index) => (
            <div key={index} className="flex items-start gap-3">
              <Label htmlFor={`story-paragraph-${index}`} className="sr-only">
                Story paragraph {index + 1}
              </Label>
              <Textarea
                id={`story-paragraph-${index}`}
                value={paragraph}
                onChange={(e) => updateStoryParagraph(index, e.target.value)}
                placeholder="Add a paragraph about your work and perspective."
                rows={3}
              />
              <IconAction
                icon={X}
                label="Remove story paragraph"
                type="button"
                variant="ghost"
                onClick={() => removeStoryParagraph(index)}
              />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addStoryParagraph}>
            <Plus className="mr-2 h-4 w-4" />
            Add Story Paragraph
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Working Principles</CardTitle>
          <CardDescription>
            Short beliefs that explain how you approach product work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.principles.map((principle, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="grid flex-1 gap-3 md:grid-cols-[0.7fr_1.3fr]">
                <Label
                  htmlFor={`principle-title-${index}`}
                  className="sr-only"
                >
                  Principle {index + 1} title
                </Label>
                <Input
                  id={`principle-title-${index}`}
                  value={principle.title}
                  onChange={(e) =>
                    updatePrinciple(index, "title", e.target.value)
                  }
                  placeholder="Find the signal"
                />
                <Label
                  htmlFor={`principle-copy-${index}`}
                  className="sr-only"
                >
                  Principle {index + 1} description
                </Label>
                <Textarea
                  id={`principle-copy-${index}`}
                  value={principle.copy}
                  onChange={(e) =>
                    updatePrinciple(index, "copy", e.target.value)
                  }
                  placeholder="Explain the principle in one sentence."
                  rows={2}
                />
              </div>
              <IconAction
                icon={X}
                label="Remove working principle"
                type="button"
                variant="ghost"
                onClick={() => removePrinciple(index)}
              />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addPrinciple}>
            <Plus className="mr-2 h-4 w-4" />
            Add Principle
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Key-value pairs displayed in the about section (e.g., Age: 25,
            Location: NYC).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.personal.map((item, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`personal-label-${index}`}>Label</Label>
                <Input
                  id={`personal-label-${index}`}
                  value={item.label}
                  onChange={(e) =>
                    updatePersonalInfo(index, "label", e.target.value)
                  }
                  placeholder="Age"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor={`personal-value-${index}`}>Value</Label>
                <Input
                  id={`personal-value-${index}`}
                  value={item.value}
                  onChange={(e) =>
                    updatePersonalInfo(index, "value", e.target.value)
                  }
                  placeholder="25"
                />
              </div>
              <IconAction
                icon={X}
                label="Remove personal information"
                type="button"
                variant="ghost"
                className="mt-8"
                onClick={() => removePersonalInfo(index)}
              />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addPersonalInfo}>
            <Plus className="mr-2 h-4 w-4" />
            Add Personal Info
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FormMessage>{formError}</FormMessage>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
