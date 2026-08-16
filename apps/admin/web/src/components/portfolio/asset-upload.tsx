"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { ExternalLink, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@jayant/web-ui/button";
import { Input } from "@jayant/web-ui/input";
import { Label } from "@jayant/web-ui/label";

import {
  PORTFOLIO_ASSET_ACCEPT,
  type PortfolioAssetKind,
} from "@/lib/portfolio-assets";

const PORTFOLIO_ORIGIN =
  process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? "https://jayantgoyal.com";

function resolveAssetUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return `${PORTFOLIO_ORIGIN}${value}`;
  }

  return value;
}

export function PortfolioAssetUpload({
  id,
  label,
  kind,
  value,
  onChange,
  required = false,
}: {
  id: string;
  label: string;
  kind: PortfolioAssetKind;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const isImage =
    kind.endsWith("image") || kind.endsWith("preview") || kind === "writing-cover";
  const resolvedValue = value ? resolveAssetUrl(value) : "";

  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("kind", kind);
      const response = await fetch("/api/portfolio/assets", {
        method: "POST",
        body,
      });
      const result = (await response.json()) as {
        data?: { url: string };
        error?: string;
      };
      if (!response.ok || !result.data) {
        throw new Error(result.error ?? "Asset upload failed");
      }
      onChange(result.data.url);
      toast.success(`${label} uploaded`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Asset upload failed",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste a URL or upload a file"
        required={required}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={uploading} asChild>
          <label className="cursor-pointer">
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploading ? "Uploading…" : "Upload file"}
            <input
              className="sr-only"
              type="file"
              accept={PORTFOLIO_ASSET_ACCEPT[kind]}
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.target.value = "";
              }}
            />
          </label>
        </Button>
        {value ? (
          <a
            href={resolvedValue}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Open current <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>
      {isImage && value ? (
        <img
          src={resolvedValue}
          alt="Current uploaded preview"
          className="max-h-48 w-full rounded-md border bg-muted object-contain"
        />
      ) : null}
    </div>
  );
}
