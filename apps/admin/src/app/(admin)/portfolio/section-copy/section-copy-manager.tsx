"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import { Switch } from "@repo/ui/switch";

import { updatePortfolioData } from "@/lib/portfolio-api";
import type { SectionContent } from "@/lib/types";

type EditableField =
  | "eyebrow"
  | "headline"
  | "accent"
  | "description"
  | "supporting_text";

function sectionLabel(sectionKey: string) {
  return sectionKey
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function SectionCopyManager({
  initialData,
}: {
  initialData: SectionContent[];
}) {
  const [sections, setSections] = useState(initialData);
  const [savingId, setSavingId] = useState<string | null>(null);

  const updateField = (id: string, field: EditableField, value: string) => {
    setSections((current) =>
      current.map((section) =>
        section.id === id ? { ...section, [field]: value } : section,
      ),
    );
  };

  const saveSection = async (section: SectionContent) => {
    setSavingId(section.id);
    try {
      const result = await updatePortfolioData<SectionContent>(
        "section_content",
        section.id,
        {
          eyebrow: section.eyebrow,
          headline: section.headline,
          accent: section.accent,
          description: section.description,
          supporting_text: section.supporting_text,
          is_visible: section.is_visible,
        },
      );
      if (result.error) throw new Error(result.error);
      const savedSection = result.data;
      if (savedSection) {
        setSections((current) =>
          current.map((item) => (item.id === section.id ? savedSection : item)),
        );
      }
      toast.success(`${sectionLabel(section.section_key)} copy updated`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update section copy",
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editorial Section Copy</CardTitle>
          <CardDescription>
            These fields are the live headings and descriptions used by the
            public Portfolio. Saved changes appear on the next public refresh.
          </CardDescription>
        </CardHeader>
      </Card>

      {sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle>{sectionLabel(section.section_key)}</CardTitle>
            <CardDescription>
              Public section key: #{section.section_key}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void saveSection(section);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor={`${section.id}-eyebrow`}>Eyebrow</Label>
                <Input
                  id={`${section.id}-eyebrow`}
                  value={section.eyebrow}
                  onChange={(event) =>
                    updateField(section.id, "eyebrow", event.target.value)
                  }
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id={`${section.id}-visible`}
                  checked={section.is_visible}
                  onCheckedChange={(is_visible) =>
                    setSections((current) =>
                      current.map((item) =>
                        item.id === section.id ? { ...item, is_visible } : item,
                      ),
                    )
                  }
                />
                <Label htmlFor={`${section.id}-visible`}>
                  Render this section or page publicly
                </Label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`${section.id}-headline`}>Headline</Label>
                  <Textarea
                    id={`${section.id}-headline`}
                    value={section.headline ?? ""}
                    onChange={(event) =>
                      updateField(section.id, "headline", event.target.value)
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${section.id}-accent`}>Accent Text</Label>
                  <Textarea
                    id={`${section.id}-accent`}
                    value={section.accent ?? ""}
                    onChange={(event) =>
                      updateField(section.id, "accent", event.target.value)
                    }
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional emphasized continuation, currently used by Contact.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${section.id}-description`}>Description</Label>
                <Textarea
                  id={`${section.id}-description`}
                  value={section.description ?? ""}
                  onChange={(event) =>
                    updateField(section.id, "description", event.target.value)
                  }
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${section.id}-supporting`}>
                  Supporting Text
                </Label>
                <Input
                  id={`${section.id}-supporting`}
                  value={section.supporting_text ?? ""}
                  onChange={(event) =>
                    updateField(
                      section.id,
                      "supporting_text",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={savingId === section.id}>
                  {savingId === section.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save {sectionLabel(section.section_key)}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
