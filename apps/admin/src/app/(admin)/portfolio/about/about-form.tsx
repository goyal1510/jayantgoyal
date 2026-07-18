"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Plus, X } from "lucide-react";
import { createPortfolioData, updatePortfolioData } from "@/lib/portfolio-api";
import { Button } from "@repo/ui/button";
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

interface AboutFormProps {
  initialData: About | null;
}

export function AboutForm({ initialData }: AboutFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    summary: initialData?.summary ?? "",
    headline: initialData?.headline ?? "",
    objective: initialData?.objective ?? "",
    story: initialData?.story ?? ([] as string[]),
    principles: initialData?.principles ?? ([] as PortfolioPrinciple[]),
    personal: initialData?.personal ?? ([] as PersonalInfo[]),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (initialData?.id) {
        const result = await updatePortfolioData<About>(
          "about",
          initialData.id,
          formData,
        );
        if (result.error) throw new Error(result.error);
        toast.success("About section updated");
      } else {
        const result = await createPortfolioData<About>("about", formData);
        if (result.error) throw new Error(result.error);
        toast.success("About section created");
      }

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save about section",
      );
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
              <Textarea
                value={paragraph}
                onChange={(e) => updateStoryParagraph(index, e.target.value)}
                placeholder="Add a paragraph about your work and perspective."
                rows={3}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeStoryParagraph(index)}
                aria-label="Remove story paragraph"
              >
                <X className="h-4 w-4" />
              </Button>
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
                <Input
                  value={principle.title}
                  onChange={(e) =>
                    updatePrinciple(index, "title", e.target.value)
                  }
                  placeholder="Find the signal"
                />
                <Textarea
                  value={principle.copy}
                  onChange={(e) =>
                    updatePrinciple(index, "copy", e.target.value)
                  }
                  placeholder="Explain the principle in one sentence."
                  rows={2}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePrinciple(index)}
                aria-label="Remove principle"
              >
                <X className="h-4 w-4" />
              </Button>
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
                <Label>Label</Label>
                <Input
                  value={item.label}
                  onChange={(e) =>
                    updatePersonalInfo(index, "label", e.target.value)
                  }
                  placeholder="Age"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Value</Label>
                <Input
                  value={item.value}
                  onChange={(e) =>
                    updatePersonalInfo(index, "value", e.target.value)
                  }
                  placeholder="25"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-8"
                onClick={() => removePersonalInfo(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addPersonalInfo}>
            <Plus className="mr-2 h-4 w-4" />
            Add Personal Info
          </Button>
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving}>
        {saving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save Changes
      </Button>
    </form>
  );
}
