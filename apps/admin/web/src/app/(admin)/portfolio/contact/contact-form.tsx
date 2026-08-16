"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Plus, X } from "lucide-react";
import { PORTFOLIO_SOCIAL_ICON_OPTIONS } from "@jayantgoyal/portfolio-contracts";
import { createPortfolioData, updatePortfolioData } from "@/lib/portfolio-api";
import { Button } from "@jayantgoyal/web-ui/button";
import { IconAction } from "@jayantgoyal/web-ui/icon-action";
import { FormMessage } from "@jayantgoyal/web-ui/form-message";
import { Input } from "@jayantgoyal/web-ui/input";
import { Label } from "@jayantgoyal/web-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jayantgoyal/web-ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";
import type { Contact, SocialLink } from "@/lib/types";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";
import { AccessibleForm } from "@/components/accessible-form";

interface ContactFormProps {
  initialData: Contact | null;
}

export function ContactForm({ initialData }: ContactFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [invalidSocialIndex, setInvalidSocialIndex] = useState<number | null>(
    null,
  );
  const [formData, setFormData] = useState({
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    location: initialData?.location ?? "",
    socials: initialData?.socials ?? ([] as SocialLink[]),
  });
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({
      email: initialData?.email ?? "",
      phone: initialData?.phone ?? "",
      location: initialData?.location ?? "",
      socials: initialData?.socials ?? [],
    }),
  );
  const isDirty = JSON.stringify(formData) !== savedSnapshot;
  useUnsavedChangesGuard(isDirty && !saving);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const invalidSocialIndex = formData.socials.findIndex(
      (social) =>
        !social.label.trim() || !social.href.trim() || !social.icon_key,
    );
    setInvalidSocialIndex(
      invalidSocialIndex === -1 ? null : invalidSocialIndex,
    );
    if (invalidSocialIndex !== -1) {
      const message =
        "Complete each social link label, URL, and icon before saving";
      setFormError(message);
      toast.error(message);
      return;
    }
    setSaving(true);

    try {
      if (initialData?.id) {
        const result = await updatePortfolioData(
          "contact",
          initialData.id,
          formData,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Contact info updated");
      } else {
        const result = await createPortfolioData("contact", formData);
        if (result.error) throw new Error(result.error);
        toast.success("Contact info created");
      }

      setSavedSnapshot(JSON.stringify(formData));
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save contact info";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const addSocial = () => {
    setFormData({
      ...formData,
      socials: [...formData.socials, { label: "", href: "", icon_key: "" }],
    });
  };

  const removeSocial = (index: number) => {
    setFormData({
      ...formData,
      socials: formData.socials.filter((_, i) => i !== index),
    });
  };

  const updateSocial = (
    index: number,
    field: keyof SocialLink,
    value: string,
  ) => {
    const updated = [...formData.socials];
    const currentItem = updated[index];
    if (!currentItem) return;
    updated[index] = {
      label: field === "label" ? value : currentItem.label,
      href: field === "href" ? value : currentItem.href,
      icon_key: field === "icon_key" ? value : currentItem.icon_key,
    };
    setFormData({ ...formData, socials: updated });
  };

  return (
    <AccessibleForm onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
          <CardDescription>
            Your primary contact information. The public form is delivered by
            the Portfolio server through Resend; provider secrets never enter
            this editor or the browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>
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
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>
            Links to your social profiles and online presence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.socials.map((social, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="grid flex-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor={`social-label-${index}`}>Label</Label>
                  <Input
                    id={`social-label-${index}`}
                    value={social.label}
                    aria-invalid={
                      invalidSocialIndex === index && !social.label.trim()
                    }
                    aria-describedby={
                      invalidSocialIndex === index
                        ? `social-error-${index}`
                        : undefined
                    }
                    onChange={(e) =>
                      updateSocial(index, "label", e.target.value)
                    }
                    placeholder="LinkedIn"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`social-url-${index}`}>URL</Label>
                  <Input
                    id={`social-url-${index}`}
                    type="url"
                    value={social.href}
                    aria-invalid={
                      invalidSocialIndex === index && !social.href.trim()
                    }
                    aria-describedby={
                      invalidSocialIndex === index
                        ? `social-error-${index}`
                        : undefined
                    }
                    onChange={(e) =>
                      updateSocial(index, "href", e.target.value)
                    }
                    placeholder="https://linkedin.com/in/..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`social-icon-${index}`}>Icon</Label>
                  <Select
                    value={social.icon_key || undefined}
                    onValueChange={(value) =>
                      updateSocial(index, "icon_key", value)
                    }
                  >
                    <SelectTrigger
                      id={`social-icon-${index}`}
                      aria-invalid={
                        invalidSocialIndex === index && !social.icon_key
                      }
                      aria-describedby={
                        invalidSocialIndex === index
                          ? `social-error-${index}`
                          : undefined
                      }
                    >
                      <SelectValue placeholder="Choose an icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {PORTFOLIO_SOCIAL_ICON_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {invalidSocialIndex === index ? (
                  <FormMessage id={`social-error-${index}`}>
                    Complete this social link before saving.
                  </FormMessage>
                ) : null}
              </div>
              <IconAction
                icon={X}
                label={`Remove ${social.label || "social link"}`}
                variant="ghost"
                className="mt-8"
                onClick={() => removeSocial(index)}
              />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addSocial}>
            <Plus className="mr-2 h-4 w-4" />
            Add Social Link
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
    </AccessibleForm>
  );
}
