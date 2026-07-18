"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Plus, X } from "lucide-react";
import { createPortfolioData, updatePortfolioData } from "@/lib/portfolio-api";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Switch } from "@repo/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import type { Contact, SocialLink } from "@/lib/types";

interface ContactFormProps {
  initialData: Contact | null;
}

export function ContactForm({ initialData }: ContactFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    location: initialData?.location ?? "",
    socials: initialData?.socials ?? ([] as SocialLink[]),
    is_visible: initialData?.is_visible ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (initialData?.id) {
        const result = await updatePortfolioData<Contact>(
          "contact",
          initialData.id,
          formData,
        );
        if (result.error) throw new Error(result.error);
        toast.success("Contact info updated");
      } else {
        const result = await createPortfolioData<Contact>("contact", formData);
        if (result.error) throw new Error(result.error);
        toast.success("Contact info created");
      }

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save contact info",
      );
    } finally {
      setSaving(false);
    }
  };

  const addSocial = () => {
    setFormData({
      ...formData,
      socials: [
        ...formData.socials,
        { label: "", href: "", icon_key: "", color: "" },
      ],
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
      color: field === "color" ? value : currentItem.color,
    };
    setFormData({ ...formData, socials: updated });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
          <CardDescription>Your primary contact information.</CardDescription>
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
              <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={social.label}
                    onChange={(e) =>
                      updateSocial(index, "label", e.target.value)
                    }
                    placeholder="LinkedIn"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={social.href}
                    onChange={(e) =>
                      updateSocial(index, "href", e.target.value)
                    }
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color Class</Label>
                  <Input
                    value={social.color}
                    onChange={(e) =>
                      updateSocial(index, "color", e.target.value)
                    }
                    placeholder="text-blue-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon Key</Label>
                  <Input
                    value={social.icon_key}
                    onChange={(e) =>
                      updateSocial(index, "icon_key", e.target.value)
                    }
                    placeholder="Linkedin"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-8"
                onClick={() => removeSocial(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addSocial}>
            <Plus className="mr-2 h-4 w-4" />
            Add Social Link
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
            <Label htmlFor="is_visible">
              Show contact section on portfolio
            </Label>
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
