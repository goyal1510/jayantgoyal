"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import {
  emptySectionLabels,
  getSectionCopyHints,
  PORTFOLIO_SECTION_LABEL_FIELDS,
  normalizeSectionLabels,
  type PortfolioSectionKey,
} from "@jayantgoyal/portfolio-contracts";
import { APP_BRANDS } from "@jayantgoyal/web-brand";
import { Button } from "@jayantgoyal/web-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";
import { Input } from "@jayantgoyal/web-ui/input";
import { Label } from "@jayantgoyal/web-ui/label";
import { FormMessage } from "@jayantgoyal/web-ui/form-message";
import { Switch } from "@jayantgoyal/web-ui/switch";
import { Textarea } from "@jayantgoyal/web-ui/textarea";

import { savePortfolioSectionPresentation } from "@/lib/portfolio-api";
import type { NavItem, SectionContent } from "@/lib/types";
import { AccessibleForm } from "@/components/accessible-form";

interface SectionEditorialPanelProps {
  sectionKey: PortfolioSectionKey;
  sectionContent: SectionContent | null;
  navigation: NavItem | null;
  title?: string;
  description?: string;
}

const PUBLIC_SECTION_PATHS: Record<PortfolioSectionKey, string> = {
  hero: "/",
  home: "/",
  about: "/about",
  skills: "/#skills",
  education: "/#about",
  experience: "/#experience",
  credentials: "/#experience",
  github_activity: "/#github-activity",
  analytics: "/analytics",
  work: "/work",
  contact: "/#contact",
  writing: "/writing",
  article: "/writing",
  resume: "/resume",
  studio: "/studio",
  "case-studies": "/case-studies",
  engineering: "/engineering",
};

function serializePresentation(
  copy: {
    eyebrow: string;
    headline: string;
    accent: string;
    description: string;
    supporting_text: string;
    labels: Record<string, string>;
    is_visible: boolean;
  },
  navigation: {
    label: string;
    note: string | null;
    sort_order: number;
    is_visible: boolean;
  },
) {
  return JSON.stringify({ copy, navigation });
}

export function SectionEditorialPanel({
  sectionKey,
  sectionContent,
  navigation,
  title = "Section presentation",
  description = "The copy and visibility that frame this workspace on the public Portfolio. It is saved here with the content it describes.",
}: SectionEditorialPanelProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">(
    "idle",
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    eyebrow?: string;
    navigationLabel?: string;
  }>({});
  const [copy, setCopy] = useState({
    eyebrow: sectionContent?.eyebrow ?? "",
    headline: sectionContent?.headline ?? "",
    accent: sectionContent?.accent ?? "",
    description: sectionContent?.description ?? "",
    supporting_text: sectionContent?.supporting_text ?? "",
    labels: {
      ...emptySectionLabels(sectionKey),
      ...(normalizeSectionLabels(sectionContent?.labels) ?? {}),
    },
    is_visible: sectionContent?.is_visible ?? true,
  });
  const [nav, setNav] = useState({
    label: navigation?.label ?? "",
    note: navigation?.note ?? "",
    sort_order: navigation?.sort_order ?? 0,
    is_visible: navigation?.is_visible ?? true,
  });
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    serializePresentation(copy, nav),
  );
  const hints = getSectionCopyHints(sectionKey);
  const extraFields = PORTFOLIO_SECTION_LABEL_FIELDS[sectionKey] ?? [];
  const currentSnapshot = serializePresentation(copy, nav);
  const isDirty = currentSnapshot !== savedSnapshot;

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaveState("idle");
    setFormError(null);
    setFieldErrors({});

    try {
      if (!copy.eyebrow.trim()) {
        setFieldErrors({
          eyebrow: "Add an eyebrow so visitors understand this section.",
        });
        throw new Error("Add an eyebrow so visitors understand this section.");
      }
      if (navigation && !nav.label.trim()) {
        setFieldErrors({
          navigationLabel: "Add a navigation label before saving this section.",
        });
        throw new Error("Add a navigation label before saving this section.");
      }

      const result = await savePortfolioSectionPresentation({
        section_key: sectionKey,
        copy,
        navigation: navigation ? nav : null,
      });

      if (result.error) {
        const fieldHint = result.fields?.length
          ? ` (${result.fields.join("; ")})`
          : "";
        throw new Error(`${result.error}${fieldHint}`);
      }

      toast.success("Section presentation saved");
      setSaveState("saved");
      setFormError(null);
      setSavedSnapshot(currentSnapshot);
      router.refresh();
    } catch (error) {
      setSaveState("error");
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save section presentation";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-dashed bg-muted/20">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`${APP_BRANDS.portfolio.canonicalUrl}${PUBLIC_SECTION_PATHS[sectionKey]}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Open public <ExternalLink className="size-3" />
            </a>
            <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              #{sectionKey}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AccessibleForm onSubmit={save} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${sectionKey}-eyebrow`}>
                {hints.eyebrow.label}
              </Label>
              <Input
                id={`${sectionKey}-eyebrow`}
                value={copy.eyebrow}
                aria-invalid={Boolean(fieldErrors.eyebrow)}
                aria-describedby={
                  fieldErrors.eyebrow
                    ? `${sectionKey}-eyebrow-error`
                    : `${sectionKey}-eyebrow-help`
                }
                onChange={(event) =>
                  setCopy({ ...copy, eyebrow: event.target.value })
                }
                placeholder="A small framing label"
              />
              <p
                id={`${sectionKey}-eyebrow-help`}
                className="text-xs text-muted-foreground"
              >
                {hints.eyebrow.help}
              </p>
              <FormMessage id={`${sectionKey}-eyebrow-error`}>
                {fieldErrors.eyebrow}
              </FormMessage>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${sectionKey}-accent`}>{hints.accent.label}</Label>
              <Input
                id={`${sectionKey}-accent`}
                value={copy.accent}
                aria-describedby={`${sectionKey}-accent-help`}
                onChange={(event) =>
                  setCopy({ ...copy, accent: event.target.value })
                }
                placeholder="Optional highlighted phrase"
              />
              <p
                id={`${sectionKey}-accent-help`}
                className="text-xs text-muted-foreground"
              >
                {hints.accent.help}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${sectionKey}-headline`}>
              {hints.headline.label}
            </Label>
            <Input
              id={`${sectionKey}-headline`}
              value={copy.headline}
              aria-describedby={`${sectionKey}-headline-help`}
              onChange={(event) =>
                setCopy({ ...copy, headline: event.target.value })
              }
              placeholder="The section's main editorial statement"
            />
            <p
              id={`${sectionKey}-headline-help`}
              className="text-xs text-muted-foreground"
            >
              {hints.headline.help}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${sectionKey}-description`}>
                {hints.description.label}
              </Label>
              <Textarea
                id={`${sectionKey}-description`}
                value={copy.description}
                aria-describedby={`${sectionKey}-description-help`}
                onChange={(event) =>
                  setCopy({ ...copy, description: event.target.value })
                }
                rows={4}
              />
              <p
                id={`${sectionKey}-description-help`}
                className="text-xs text-muted-foreground"
              >
                {hints.description.help}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${sectionKey}-supporting`}>
                {hints.supporting_text.label}
              </Label>
              <Textarea
                id={`${sectionKey}-supporting`}
                value={copy.supporting_text}
                aria-describedby={`${sectionKey}-supporting-help`}
                onChange={(event) =>
                  setCopy({ ...copy, supporting_text: event.target.value })
                }
                rows={4}
              />
              <p
                id={`${sectionKey}-supporting-help`}
                className="text-xs text-muted-foreground"
              >
                {hints.supporting_text.help}
              </p>
            </div>
          </div>
          {extraFields.length > 0 ? (
            <div className="grid gap-4 rounded-xl border bg-background p-4 md:grid-cols-2">
              {extraFields.map((field) => (
                <div className="space-y-2" key={field.key}>
                  <Label htmlFor={`${sectionKey}-${field.key}`}>
                    {field.label}
                  </Label>
                  <Input
                    id={`${sectionKey}-${field.key}`}
                    value={copy.labels[field.key] ?? ""}
                    aria-describedby={`${sectionKey}-${field.key}-help`}
                    onChange={(event) =>
                      setCopy({
                        ...copy,
                        labels: {
                          ...copy.labels,
                          [field.key]: event.target.value,
                        },
                      })
                    }
                  />
                  <p
                    id={`${sectionKey}-${field.key}-help`}
                    className="text-xs text-muted-foreground"
                  >
                    {field.help}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          {navigation ? (
            <div className="grid gap-4 rounded-xl border bg-background p-4 md:grid-cols-[1fr_1fr_120px_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor={`${sectionKey}-label`}>Navigation label</Label>
                <Input
                  id={`${sectionKey}-label`}
                  value={nav.label}
                  aria-invalid={Boolean(fieldErrors.navigationLabel)}
                  aria-describedby={
                    fieldErrors.navigationLabel
                      ? `${sectionKey}-label-error`
                      : undefined
                  }
                  onChange={(event) =>
                    setNav({ ...nav, label: event.target.value })
                  }
                />
                <FormMessage id={`${sectionKey}-label-error`}>
                  {fieldErrors.navigationLabel}
                </FormMessage>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${sectionKey}-note`}>Mobile note</Label>
                <Input
                  id={`${sectionKey}-note`}
                  value={nav.note ?? ""}
                  onChange={(event) =>
                    setNav({ ...nav, note: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${sectionKey}-order`}>Order</Label>
                <Input
                  id={`${sectionKey}-order`}
                  type="number"
                  value={nav.sort_order}
                  onChange={(event) =>
                    setNav({ ...nav, sort_order: Number(event.target.value) })
                  }
                />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <Switch
                  checked={nav.is_visible}
                  onCheckedChange={(is_visible) =>
                    setNav({ ...nav, is_visible })
                  }
                />
                Visible
              </label>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={copy.is_visible}
                onCheckedChange={(is_visible) =>
                  setCopy({ ...copy, is_visible })
                }
              />
              Include this section in the public Portfolio
            </label>
            <div className="flex items-center gap-3">
              <FormMessage>{formError}</FormMessage>
              {sectionContent?.updated_at ? (
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  Updated {new Date(sectionContent.updated_at).toLocaleString()}
                </span>
              ) : null}
              {saveState === "saved" ? (
                <span
                  className="text-xs text-emerald-600 dark:text-emerald-400"
                  role="status"
                  aria-live="polite"
                >
                  Saved just now
                </span>
              ) : null}
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save presentation
              </Button>
            </div>
          </div>
        </AccessibleForm>
      </CardContent>
    </Card>
  );
}
