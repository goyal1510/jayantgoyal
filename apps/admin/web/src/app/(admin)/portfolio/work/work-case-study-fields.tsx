import { X } from "lucide-react";

import { Button } from "@jayant/web-ui/button";
import { Input } from "@jayant/web-ui/input";
import { Label } from "@jayant/web-ui/label";
import { Switch } from "@jayant/web-ui/switch";
import { Textarea } from "@jayant/web-ui/textarea";

import type { WorkFormData } from "./work-form-data";

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

type WorkCaseStudyFieldsProps = {
  formData: WorkFormData;
  setFormData: (data: WorkFormData) => void;
};

/** Owns case-study draft creation, decision editing, and publish controls. */
export function WorkCaseStudyFields({
  formData,
  setFormData,
}: WorkCaseStudyFieldsProps) {
  function updateCaseStudy(
    field: Exclude<keyof NonNullable<WorkFormData["case_study"]>, "decisions">,
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
                onChange={(event) => updateCaseStudy(field, event.target.value)}
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
                  const caseStudy = formData.case_study ?? emptyCaseStudy;
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
                    const caseStudy = formData.case_study ?? emptyCaseStudy;
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
                onChange={(event) => updateCaseStudy(field, event.target.value)}
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
                setFormData({ ...formData, case_study_published })
              }
            />
            <Label htmlFor="case_study_published">Publish case study</Label>
          </div>
        </div>
      ) : null}
    </section>
  );
}
