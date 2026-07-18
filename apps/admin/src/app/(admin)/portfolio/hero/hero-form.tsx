"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
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
import type { Hero } from "@/lib/types";

interface HeroFormProps {
  initialData: Hero | null;
}

export function HeroForm({ initialData }: HeroFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name ?? "",
    role: initialData?.role ?? "",
    tagline: initialData?.tagline ?? "",
    blurb: initialData?.blurb ?? "",
    location: initialData?.location ?? "",
    headline: initialData?.headline ?? "",
    current_title: initialData?.current_title ?? "",
    availability: initialData?.availability ?? "",
    resume_url: initialData?.resume_url ?? "",
    is_visible: initialData?.is_visible ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (initialData?.id) {
        const result = await updatePortfolioData<Hero>(
          "hero",
          initialData.id,
          formData,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Hero section updated");
      } else {
        const result = await createPortfolioData<Hero>("hero", formData);
        if (result.error) throw new Error(result.error);
        toast.success("Hero section created");
      }

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save hero section",
      );
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume_url">Resume URL</Label>
              <Input
                id="resume_url"
                type="url"
                value={formData.resume_url}
                onChange={(e) =>
                  setFormData({ ...formData, resume_url: e.target.value })
                }
                placeholder="https://jayantgoyal.com/api/resume"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <Input
              id="availability"
              value={formData.availability}
              onChange={(e) =>
                setFormData({ ...formData, availability: e.target.value })
              }
              placeholder="Open to thoughtful product and engineering collaborations."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={formData.tagline}
              onChange={(e) =>
                setFormData({ ...formData, tagline: e.target.value })
              }
              placeholder="Building the future, one line at a time"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blurb">Blurb</Label>
            <Textarea
              id="blurb"
              value={formData.blurb}
              onChange={(e) =>
                setFormData({ ...formData, blurb: e.target.value })
              }
              placeholder="A short introduction about yourself..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="San Francisco, CA"
            />
          </div>

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

          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
