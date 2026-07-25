"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Github, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { FormMessage } from "@repo/ui/form-message";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";

import { updatePortfolioData } from "@/lib/portfolio-api";
import type { Hero } from "@/lib/types";
import { AccessibleForm } from "@/components/accessible-form";

const GITHUB_USERNAME_PATTERN = /^[a-zA-Z0-9-]{1,39}$/;

type GithubSource = Pick<Hero, "id" | "github_username">;

export function ActivitySourceForm({
  initialData,
}: {
  initialData: GithubSource | null;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(initialData?.github_username ?? "");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const normalized = username.trim();

    if (!GITHUB_USERNAME_PATTERN.test(normalized)) {
      const message =
        "Enter a valid GitHub username (letters, numbers, or hyphens).";
      setFormError(message);
      toast.error(message);
      return;
    }

    if (!initialData?.id) {
      const message = "Create the Home record before configuring GitHub.";
      setFormError(message);
      toast.error(message);
      return;
    }

    setSaving(true);
    try {
      const result = await updatePortfolioData("hero", initialData.id, {
        github_username: normalized,
      });
      if (result.error) throw new Error(result.error);
      setUsername(normalized);
      toast.success("GitHub source saved");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save GitHub source";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Github className="size-5" />
          GitHub source
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AccessibleForm
          onSubmit={save}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="activity-username">GitHub username</Label>
            <Input
              id="activity-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="goyal1510"
              autoComplete="off"
              required
            />
            <p className="text-xs text-muted-foreground">
              The public Portfolio fetches contribution and repository data for
              this account at render time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
            <FormMessage>{formError}</FormMessage>
            <Button type="submit" disabled={saving} className="shrink-0">
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save source
            </Button>
          </div>
        </AccessibleForm>
      </CardContent>
    </Card>
  );
}
