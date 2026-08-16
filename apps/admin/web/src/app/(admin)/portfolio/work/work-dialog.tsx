"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

import { Badge } from "@jayant/web-ui/badge";
import { Button } from "@jayant/web-ui/button";
import { FormMessage } from "@jayant/web-ui/form-message";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@jayant/web-ui/dialog";
import { Input } from "@jayant/web-ui/input";
import { Label } from "@jayant/web-ui/label";
import { Switch } from "@jayant/web-ui/switch";
import { Textarea } from "@jayant/web-ui/textarea";

import { PortfolioAssetUpload } from "@/components/portfolio/asset-upload";
import { AccessibleForm } from "@/components/accessible-form";
import type { WorkItem } from "@/lib/types";

export type WorkFormData = Omit<WorkItem, "id" | "created_at" | "updated_at">;

const emptyCaseStudy: NonNullable<WorkFormData["case_study"]> = {
  problem: "",
  solution: "",
  architecture: "",
  decisions: [
    { title: "", detail: "" },
    { title: "", detail: "" },
  ],
  security: "",
  tradeoffs: "",
  outcome: "",
  next_improvement: "",
};

export const emptyWorkForm: WorkFormData = {
  name: "",
  slug: "",
  eyebrow: "",
  short_description: "",
  impact: "",
  contribution: "",
  year_label: "",
  image_url: "",
  image_alt: "",
  case_study: null,
  case_study_published: false,
  tags: [],
  github_link: "",
  live_link: "",
  sort_order: 0,
  is_visible: true,
};

export function WorkDialog({
  open,
  onOpenChange,
  editing,
  formData,
  setFormData,
  onSubmit,
  saving,
  errorMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: WorkItem | null;
  formData: WorkFormData;
  setFormData: (data: WorkFormData) => void;
  onSubmit: (event: React.FormEvent) => void;
  saving: boolean;
  errorMessage?: string | null;
}) {
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || formData.tags.includes(tag)) return;
    setFormData({ ...formData, tags: [...formData.tags, tag] });
    setTagInput("");
  }

  function updateCaseStudy(
    field: Exclude<
      keyof NonNullable<WorkFormData["case_study"]>,
      "decisions"
    >,
    value: string,
  ) {
    setFormData({
      ...formData,
      case_study: {
        ...(formData.case_study ?? emptyCaseStudy),
        [field]: value,
      },
    });
  }

  function updateDecision(
    index: number,
    field: "title" | "detail",
    value: string,
  ) {
    const caseStudy = formData.case_study ?? emptyCaseStudy;
    const decisions = caseStudy.decisions.map((decision, decisionIndex) =>
      decisionIndex === index ? { ...decision, [field]: value } : decision,
    );
    setFormData({
      ...formData,
      case_study: { ...caseStudy, decisions },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setTagInput("");
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Work" : "Add Work"}</DialogTitle>
          <DialogDescription>
            Every field below maps directly to the public work story.
          </DialogDescription>
        </DialogHeader>
        <AccessibleForm onSubmit={onSubmit}>
          <div className="space-y-5 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Work Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({ ...formData, name: event.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(event) =>
                    setFormData({ ...formData, slug: event.target.value })
                  }
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eyebrow">Story Category</Label>
                <Input
                  id="eyebrow"
                  value={formData.eyebrow}
                  onChange={(event) =>
                    setFormData({ ...formData, eyebrow: event.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year_label">Year Label</Label>
                <Input
                  id="year_label"
                  value={formData.year_label}
                  onChange={(event) =>
                    setFormData({ ...formData, year_label: event.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="short_description">Work Summary</Label>
              <Textarea
                id="short_description"
                value={formData.short_description}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    short_description: event.target.value,
                  })
                }
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact">Outcome / Impact</Label>
              <Textarea
                id="impact"
                value={formData.impact}
                onChange={(event) =>
                  setFormData({ ...formData, impact: event.target.value })
                }
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contribution">Contribution</Label>
              <Input
                id="contribution"
                value={formData.contribution}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    contribution: event.target.value,
                  })
                }
                required
              />
            </div>

            <PortfolioAssetUpload
              id="image_url"
              label="Full Work Screenshot"
              kind="work-image"
              value={formData.image_url}
              onChange={(image_url) => setFormData({ ...formData, image_url })}
              required
            />

            <div className="space-y-2">
              <Label htmlFor="image_alt">Screenshot Description</Label>
              <Input
                id="image_alt"
                value={formData.image_alt}
                onChange={(event) =>
                  setFormData({ ...formData, image_alt: event.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work-tag-input">Technologies</Label>
              <div className="flex gap-2">
                <Input
                  id="work-tag-input"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Type a technology and press Enter"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      className="ml-1"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          tags: formData.tags.filter((item) => item !== tag),
                        })
                      }
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <section className="space-y-4 rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">Detailed case study</h3>
                  <p className="text-sm text-muted-foreground">
                    Capture the decisions and tradeoffs behind flagship work.
                  </p>
                </div>
                {formData.case_study ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        case_study: null,
                        case_study_published: false,
                      })
                    }
                  >
                    Remove draft
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        case_study: structuredClone(emptyCaseStudy),
                      })
                    }
                  >
                    Add case study
                  </Button>
                )}
              </div>

              {formData.case_study ? (
                <div className="space-y-5">
                  {(
                    [
                      ["problem", "Problem", 4],
                      ["solution", "Solution", 4],
                      ["architecture", "Architecture", 5],
                    ] as const
                  ).map(([field, label, rows]) => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={`case-study-${field}`}>{label}</Label>
                      <Textarea
                        id={`case-study-${field}`}
                        value={formData.case_study?.[field] ?? ""}
                        onChange={(event) =>
                          updateCaseStudy(field, event.target.value)
                        }
                        rows={rows}
                        required={formData.case_study_published}
                      />
                    </div>
                  ))}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Label>Key engineering decisions</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const caseStudy =
                            formData.case_study ?? emptyCaseStudy;
                          setFormData({
                            ...formData,
                            case_study: {
                              ...caseStudy,
                              decisions: [
                                ...caseStudy.decisions,
                                { title: "", detail: "" },
                              ],
                            },
                          });
                        }}
                      >
                        Add decision
                      </Button>
                    </div>
                    {formData.case_study.decisions.map((decision, index) => (
                      <div
                        key={index}
                        className="grid gap-3 rounded-md border p-3 md:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)_auto]"
                      >
                        <Input
                          aria-label={`Decision ${index + 1} title`}
                          value={decision.title}
                          onChange={(event) =>
                            updateDecision(index, "title", event.target.value)
                          }
                          placeholder="Decision"
                          required={formData.case_study_published}
                        />
                        <Textarea
                          aria-label={`Decision ${index + 1} detail`}
                          value={decision.detail}
                          onChange={(event) =>
                            updateDecision(index, "detail", event.target.value)
                          }
                          placeholder="Why this choice mattered"
                          rows={2}
                          required={formData.case_study_published}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Remove decision ${index + 1}`}
                          onClick={() => {
                            const caseStudy =
                              formData.case_study ?? emptyCaseStudy;
                            setFormData({
                              ...formData,
                              case_study: {
                                ...caseStudy,
                                decisions: caseStudy.decisions.filter(
                                  (_, decisionIndex) => decisionIndex !== index,
                                ),
                              },
                            });
                          }}
                        >
                          <X aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {(
                    [
                      ["security", "Security and authorization", 4],
                      ["tradeoffs", "Tradeoffs", 4],
                      ["outcome", "Outcome", 4],
                      ["next_improvement", "What I would improve next", 4],
                    ] as const
                  ).map(([field, label, rows]) => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={`case-study-${field}`}>{label}</Label>
                      <Textarea
                        id={`case-study-${field}`}
                        value={formData.case_study?.[field] ?? ""}
                        onChange={(event) =>
                          updateCaseStudy(field, event.target.value)
                        }
                        rows={rows}
                        required={formData.case_study_published}
                      />
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <Switch
                      id="case_study_published"
                      checked={formData.case_study_published}
                      onCheckedChange={(case_study_published) =>
                        setFormData({
                          ...formData,
                          case_study_published,
                        })
                      }
                    />
                    <Label htmlFor="case_study_published">
                      Publish case study
                    </Label>
                  </div>
                </div>
              ) : null}
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="live_link">Live Product URL</Label>
                <Input
                  id="live_link"
                  type="url"
                  value={formData.live_link ?? ""}
                  onChange={(event) =>
                    setFormData({ ...formData, live_link: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github_link">Source URL</Label>
                <Input
                  id="github_link"
                  type="url"
                  value={formData.github_link ?? ""}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      github_link: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Display Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      sort_order: Number(event.target.value),
                    })
                  }
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Switch
                  id="is_visible"
                  checked={formData.is_visible}
                  onCheckedChange={(is_visible) =>
                    setFormData({ ...formData, is_visible })
                  }
                />
                <Label htmlFor="is_visible">Visible on Portfolio</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <FormMessage>{errorMessage}</FormMessage>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editing ? "Update Work" : "Add Work"}
            </Button>
          </DialogFooter>
        </AccessibleForm>
      </DialogContent>
    </Dialog>
  );
}
