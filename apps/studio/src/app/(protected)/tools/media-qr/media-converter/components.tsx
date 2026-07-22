import type * as React from "react";
import {
  AudioLines,
  CheckCircle2,
  Clock3,
  Download,
  FileAudio,
  FileVideo2,
  History,
  Link2,
  LoaderCircle,
  ServerCog,
  ShieldCheck,
  Youtube,
} from "lucide-react";

import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Checkbox } from "@repo/ui/checkbox";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { cn } from "@repo/ui/lib/utils";
import { Progress } from "@repo/ui/progress";

import {
  CONVERSION_QUALITIES,
  formatMediaFileSize,
  type ConversionQuality,
  type MediaConversionJob,
  type OutputFormat,
} from "@/lib/tools/media-converter";

const STATUS_COPY: Record<
  MediaConversionJob["status"],
  { label: string; description: string }
> = {
  queued: {
    label: "Waiting for private worker",
    description: "Your job is safely queued and will begin automatically.",
  },
  downloading: {
    label: "Retrieving media",
    description: "The private worker is downloading the authorized source.",
  },
  converting: {
    label: "Creating output",
    description: "FFmpeg is preparing your selected format and quality.",
  },
  uploading: {
    label: "Securing download",
    description: "The output is uploading directly to private storage.",
  },
  completed: {
    label: "Ready to download",
    description: "Your temporary private download is ready.",
  },
  failed: {
    label: "Conversion failed",
    description: "Review the worker message below and try another link.",
  },
  expired: {
    label: "Download expired",
    description: "The temporary file was deleted. Start a new conversion.",
  },
};

function FormatOption({
  active,
  format,
  onSelect,
}: {
  active: boolean;
  format: OutputFormat;
  onSelect: () => void;
}) {
  const Icon = format === "mp3" ? FileAudio : FileVideo2;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        "flex min-h-24 flex-1 items-start gap-3 rounded-xl border p-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary/[0.07]"
          : "border-border hover:bg-muted/50",
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block font-semibold">{format.toUpperCase()}</span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {format === "mp3" ? "Audio only" : "Video + audio"}
        </span>
      </span>
    </button>
  );
}

export function OwnerAuthorizationNotice() {
  return (
    <Card className="border-amber-500/25 bg-amber-500/[0.05] shadow-none">
      <CardContent className="flex gap-4 p-5 sm:p-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <div className="space-y-1.5">
          <p className="font-semibold">Private, owner-authorized utility</p>
          <p className="text-sm leading-6 text-muted-foreground">
            Use this only for media you own or are explicitly authorized to
            download. Access is restricted to configured owner accounts, and
            temporary outputs are automatically deleted.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

type ConversionSetupFormProps = {
  activeJob: boolean;
  format: OutputFormat;
  isSubmitting: boolean;
  onFormatChange: (format: OutputFormat) => void;
  onQualityChange: (quality: ConversionQuality) => void;
  onRightsChange: (confirmed: boolean) => void;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onUrlChange: (url: string) => void;
  quality: ConversionQuality;
  rightsConfirmed: boolean;
  youtubeUrl: string;
};

export function ConversionSetupForm({
  activeJob,
  format,
  isSubmitting,
  onFormatChange,
  onQualityChange,
  onRightsChange,
  onSubmit,
  onUrlChange,
  quality,
  rightsConfirmed,
  youtubeUrl,
}: ConversionSetupFormProps) {
  const disabled = activeJob || isSubmitting;
  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]"
    >
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Youtube className="size-5" aria-hidden="true" />
            1. Add YouTube link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2.5">
            <Label htmlFor="youtube-media-link">
              YouTube video or Shorts URL
            </Label>
            <div className="relative">
              <Link2
                className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="youtube-media-link"
                type="url"
                value={youtubeUrl}
                disabled={disabled}
                onChange={(event) => onUrlChange(event.target.value)}
                placeholder="https://youtube.com/watch?v=…"
                className="h-11 rounded-xl pl-10"
                required
              />
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Supports standard videos, Shorts, live replay links, and youtu.be
              links. Live and upcoming streams are excluded.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-xl border p-4">
            <Checkbox
              id="media-rights-confirmation"
              checked={rightsConfirmed}
              disabled={disabled}
              onCheckedChange={(checked) => onRightsChange(checked === true)}
            />
            <Label
              htmlFor="media-rights-confirmation"
              className="cursor-pointer text-sm font-normal leading-5"
            >
              I own this media or have explicit permission to download and
              convert it.
            </Label>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <ServerCog
                className="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium">No 4.5 MB bottleneck</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Studio sends only this URL and job settings. The worker
                  uploads output directly to private storage, and your browser
                  downloads it from a short-lived signed link.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AudioLines className="size-5" aria-hidden="true" />
            2. Choose output
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Format</Label>
            <div className="flex gap-3">
              <FormatOption
                format="mp3"
                active={format === "mp3"}
                onSelect={() => onFormatChange("mp3")}
              />
              <FormatOption
                format="mp4"
                active={format === "mp4"}
                onSelect={() => onFormatChange("mp4")}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Quality</Label>
            <div className="grid grid-cols-3 gap-2">
              {CONVERSION_QUALITIES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={quality === option.id}
                  disabled={disabled}
                  onClick={() => onQualityChange(option.id)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    quality === option.id
                      ? "border-primary bg-primary/[0.07]"
                      : "hover:bg-muted/50",
                  )}
                >
                  <span className="block text-sm font-medium">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-[0.7rem] text-muted-foreground">
                    {format === "mp3" ? option.mp3Detail : option.mp4Detail}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              MP4 quality is a maximum and depends on the source upload.
            </p>
          </div>

          <Button
            type="submit"
            className="h-11 w-full rounded-xl"
            disabled={disabled || !youtubeUrl || !rightsConfirmed}
          >
            {isSubmitting ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <ServerCog className="size-4" aria-hidden="true" />
            )}
            {activeJob
              ? "Conversion in progress"
              : isSubmitting
                ? "Queueing conversion…"
                : `Create ${format.toUpperCase()}`}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

export function ConversionStatusCard({
  isDownloading,
  job,
  onDownload,
}: {
  isDownloading: boolean;
  job: MediaConversionJob;
  onDownload: () => void;
}) {
  return (
    <Card
      className={cn(
        "shadow-none",
        job.status === "completed" &&
          "border-emerald-500/25 bg-emerald-500/[0.04]",
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {job.status === "completed" ? (
            <CheckCircle2
              className="size-5 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
          ) : (
            <Clock3 className="size-5" aria-hidden="true" />
          )}
          {STATUS_COPY[job.status].label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 rounded-xl border bg-background/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">
                {job.title ?? "Reading video information…"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {STATUS_COPY[job.status].description}
              </p>
            </div>
            <span className="font-medium tabular-nums">{job.progress}%</span>
          </div>
          <Progress value={job.progress} aria-label="Conversion progress" />
          {job.errorMessage ? (
            <p className="text-xs leading-5 text-destructive">
              {job.errorMessage}
            </p>
          ) : null}
        </div>

        {job.status === "completed" ? (
          <div className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {job.outputFilename}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {job.sizeBytes !== null
                  ? formatMediaFileSize(job.sizeBytes)
                  : "Ready"}
                {job.expiresAt
                  ? ` · auto-deletes ${new Date(job.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : ""}
              </p>
            </div>
            <Button
              type="button"
              className="h-10 rounded-xl"
              disabled={isDownloading}
              onClick={onDownload}
            >
              {isDownloading ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              {isDownloading ? "Preparing…" : "Download"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function RecentConversionsCard({
  isLoading,
  jobs,
  onSelect,
  selectedJobId,
}: {
  isLoading: boolean;
  jobs: MediaConversionJob[];
  onSelect: (job: MediaConversionJob) => void;
  selectedJobId?: string;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="size-5" aria-hidden="true" />
          Recent private conversions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 py-5 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Loading conversion history…
          </div>
        ) : jobs.length ? (
          <div className="grid gap-2">
            {jobs.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelect(entry)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/40",
                  selectedJobId === entry.id &&
                    "border-primary bg-primary/[0.04]",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {entry.outputFormat === "mp3" ? (
                    <FileAudio className="size-4" aria-hidden="true" />
                  ) : (
                    <FileVideo2 className="size-4" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {entry.title ??
                      `YouTube ${entry.outputFormat.toUpperCase()}`}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {STATUS_COPY[entry.status].label} · {entry.quality}
                  </span>
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {entry.progress}%
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="py-5 text-sm text-muted-foreground">
            No conversions yet. Your temporary history will appear here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
