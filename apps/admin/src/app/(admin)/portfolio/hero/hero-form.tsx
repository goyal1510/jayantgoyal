"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { createPortfolioData, updatePortfolioData } from "@/lib/portfolio-api";
import { Button } from "@repo/ui/button";
import { FormMessage } from "@repo/ui/form-message";
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
import type { Hero } from "@/lib/types";
import { PortfolioAssetUpload } from "@/components/portfolio/asset-upload";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";

interface HeroFormProps {
  initialData: Hero | null;
}

export function HeroForm({ initialData }: HeroFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: initialData?.name ?? "",
    display_name: initialData?.display_name ?? "",
    role: initialData?.role ?? "",
    tagline: initialData?.tagline ?? "",
    blurb: initialData?.blurb ?? "",
    headline: initialData?.headline ?? "",
    current_title: initialData?.current_title ?? "",
    availability: initialData?.availability ?? "",
    resume_url: initialData?.resume_url ?? "",
    github_username: initialData?.github_username ?? "",
    seo_title: initialData?.seo_title ?? "",
    seo_description: initialData?.seo_description ?? "",
  });
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({
      name: initialData?.name ?? "",
      display_name: initialData?.display_name ?? "",
      role: initialData?.role ?? "",
      tagline: initialData?.tagline ?? "",
      blurb: initialData?.blurb ?? "",
      headline: initialData?.headline ?? "",
      current_title: initialData?.current_title ?? "",
      availability: initialData?.availability ?? "",
      resume_url: initialData?.resume_url ?? "",
      github_username: initialData?.github_username ?? "",
      seo_title: initialData?.seo_title ?? "",
      seo_description: initialData?.seo_description ?? "",
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
          "hero",
          initialData.id,
          formData,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Hero section updated");
      } else {
        const result = await createPortfolioData("hero", formData);
        if (result.error) throw new Error(result.error);
        toast.success("Hero section created");
      }

      setSavedSnapshot(JSON.stringify(formData));
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save hero section";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Details</CardTitle>
        <CardDescription>
          The hero section appears at the top of your portfolio page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Your Name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Header Wordmark</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                placeholder="Jayant"
                required
              />
              <p className="text-xs text-muted-foreground">
                The visible name in every public Portfolio header.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role">Role / Title</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                placeholder="Software Engineer"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Editorial Headline</Label>
            <Textarea
              id="headline"
              value={formData.headline}
              onChange={(e) =>
                setFormData({ ...formData, headline: e.target.value })
              }
              placeholder="I turn ambitious product ideas into clear, dependable software."
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              The primary statement visitors see first.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="current_title">Formal Current Title</Label>
              <Input
                id="current_title"
                value={formData.current_title}
                onChange={(e) =>
                  setFormData({ ...formData, current_title: e.target.value })
                }
                placeholder="Product Associate Engineer"
                required
              />
            </div>
          </div>

          <PortfolioAssetUpload
            id="resume_url"
            label="Resume PDF or Export URL"
            kind="resume"
            value={formData.resume_url}
            onChange={(resume_url) => setFormData({ ...formData, resume_url })}
            required
          />

          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <Input
              id="availability"
              value={formData.availability}
              onChange={(e) =>
                setFormData({ ...formData, availability: e.target.value })
              }
              placeholder="Open to thoughtful product and engineering collaborations."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Current Focus</Label>
            <Input
              id="tagline"
              value={formData.tagline}
              onChange={(e) =>
                setFormData({ ...formData, tagline: e.target.value })
              }
              placeholder="Healthcare product systems"
              required
            />
            <p className="text-xs text-muted-foreground">
              Shown beside the “Building” label in the hero field note.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blurb">Hero Introduction</Label>
            <Textarea
              id="blurb"
              value={formData.blurb}
              onChange={(e) =>
                setFormData({ ...formData, blurb: e.target.value })
              }
              placeholder="I'm Jayant Goyal, a full-stack product engineer..."
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              The complete sentence directly below the editorial headline.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="github_username">GitHub Username</Label>
            <Input
              id="github_username"
              value={formData.github_username}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  github_username: event.target.value,
                })
              }
              placeholder="goyal1510"
              required
            />
            <p className="text-xs text-muted-foreground">
              Drives the live contribution map and repository statistics.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seo_title">Search & Social Title</Label>
            <Input
              id="seo_title"
              value={formData.seo_title}
              onChange={(event) =>
                setFormData({ ...formData, seo_title: event.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seo_description">Search & Social Description</Label>
            <Textarea
              id="seo_description"
              value={formData.seo_description}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  seo_description: event.target.value,
                })
              }
              rows={3}
              required
            />
          </div>

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
      </CardContent>
    </Card>
  );
}
