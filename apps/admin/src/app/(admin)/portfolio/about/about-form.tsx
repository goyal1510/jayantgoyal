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
import { Switch } from "@repo/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import type { About, PersonalInfo } from "@/lib/types";

interface AboutFormProps {
  initialData: About | null;
}

export function AboutForm({ initialData }: AboutFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    summary: initialData?.summary ?? "",
    personal: initialData?.personal ?? ([] as PersonalInfo[]),
    highlights: initialData?.highlights ?? ([] as string[]),
    is_visible: initialData?.is_visible ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (initialData?.id) {
        const result = await updatePortfolioData<About>("about", initialData.id, formData);
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
        error instanceof Error ? error.message : "Failed to save about section"
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
    value: string
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

  const addHighlight = () => {
    setFormData({
      ...formData,
      highlights: [...formData.highlights, ""],
    });
  };

  const removeHighlight = (index: number) => {
    setFormData({
      ...formData,
      highlights: formData.highlights.filter((_, i) => i !== index),
    });
  };

  const updateHighlight = (index: number, value: string) => {
    const updated = [...formData.highlights];
    updated[index] = value;
    setFormData({ ...formData, highlights: updated });
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

      <Card>
        <CardHeader>
          <CardTitle>Highlights</CardTitle>
          <CardDescription>
            Key achievements or skills to highlight.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.highlights.map((highlight, index) => (
            <div key={index} className="flex gap-4 items-center">
              <Input
                className="flex-1"
                value={highlight}
                onChange={(e) => updateHighlight(index, e.target.value)}
                placeholder="5+ years of experience..."
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeHighlight(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addHighlight}>
            <Plus className="mr-2 h-4 w-4" />
            Add Highlight
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_visible"
              checked={formData.is_visible}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_visible: checked })
              }
            />
            <Label htmlFor="is_visible">Visible on portfolio</Label>
          </div>
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
