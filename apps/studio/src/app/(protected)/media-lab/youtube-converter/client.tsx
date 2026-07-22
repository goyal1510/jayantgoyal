"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  classifyYouTubeUrl,
  isActiveMediaConversionStatus,
  type ConversionQuality,
  type MediaConversionJob,
  type OutputFormat,
} from "@/lib/media-lab/youtube-converter";

import {
  ConversionSetupForm,
  ConversionStatusCard,
  OwnerAuthorizationNotice,
  RecentConversionsCard,
} from "./components";

const JOBS_ENDPOINT = "/api/media-lab/youtube-converter/jobs";

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || "The request could not be completed.");
  }
  return payload;
}

export default function YouTubeConverterClient() {
  const [youtubeUrl, setYoutubeUrl] = React.useState("");
  const [format, setFormat] = React.useState<OutputFormat>("mp3");
  const [quality, setQuality] = React.useState<ConversionQuality>("balanced");
  const [rightsConfirmed, setRightsConfirmed] = React.useState(false);
  const [job, setJob] = React.useState<MediaConversionJob | null>(null);
  const [recentJobs, setRecentJobs] = React.useState<MediaConversionJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const activeJob = job ? isActiveMediaConversionStatus(job.status) : false;
  const activeJobId = activeJob ? job?.id : null;

  const loadJobs = React.useCallback(async () => {
    try {
      const payload = await readJson<{ jobs: MediaConversionJob[] }>(
        await fetch(JOBS_ENDPOINT, { cache: "no-store" }),
      );
      setRecentJobs(payload.jobs);
      setJob((current) => {
        if (current) {
          return (
            payload.jobs.find((entry) => entry.id === current.id) ?? current
          );
        }
        return (
          payload.jobs.find((entry) =>
            isActiveMediaConversionStatus(entry.status),
          ) ??
          payload.jobs[0] ??
          null
        );
      });
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load conversions.",
      );
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  React.useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  React.useEffect(() => {
    if (!activeJobId) return;

    let canceled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const payload = await readJson<{ job: MediaConversionJob }>(
          await fetch(`${JOBS_ENDPOINT}/${activeJobId}`, {
            cache: "no-store",
          }),
        );
        if (canceled) return;
        setJob(payload.job);
        setRecentJobs((current) => [
          payload.job,
          ...current.filter((entry) => entry.id !== payload.job.id),
        ]);
        if (payload.job.status === "completed") {
          toast.success(
            `${payload.job.outputFilename ?? "Your file"} is ready.`,
          );
        }
        if (isActiveMediaConversionStatus(payload.job.status)) {
          timeout = setTimeout(poll, 2000);
        }
      } catch (error) {
        if (canceled) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to check conversion progress.",
        );
        timeout = setTimeout(poll, 5000);
      }
    };

    timeout = setTimeout(poll, 1000);
    return () => {
      canceled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [activeJobId]);

  const submitConversion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!classifyYouTubeUrl(youtubeUrl)) {
      setErrorMessage("Enter a valid YouTube video or Shorts link.");
      return;
    }
    if (!rightsConfirmed) {
      setErrorMessage("Confirm that you own or may download this media.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = await readJson<{ job: MediaConversionJob }>(
        await fetch(JOBS_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: youtubeUrl,
            outputFormat: format,
            quality,
            rightsConfirmed: true,
          }),
        }),
      );
      setJob(payload.job);
      setRecentJobs((current) => [payload.job, ...current].slice(0, 8));
      toast.success("Conversion queued on the private worker.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start conversion.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadResult = async () => {
    if (!job || job.status !== "completed") return;
    setIsDownloading(true);
    setErrorMessage(null);
    try {
      const payload = await readJson<{ url: string; filename: string }>(
        await fetch(`${JOBS_ENDPOINT}/${job.id}/download`, {
          method: "POST",
        }),
      );
      const anchor = document.createElement("a");
      anchor.href = payload.url;
      anchor.download = payload.filename;
      anchor.rel = "noreferrer";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to download the file.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <OwnerAuthorizationNotice />
      <ConversionSetupForm
        activeJob={activeJob}
        format={format}
        isSubmitting={isSubmitting}
        onFormatChange={setFormat}
        onQualityChange={setQuality}
        onRightsChange={setRightsConfirmed}
        onSubmit={submitConversion}
        onUrlChange={(url) => {
          setYoutubeUrl(url);
          setErrorMessage(null);
        }}
        quality={quality}
        rightsConfirmed={rightsConfirmed}
        youtubeUrl={youtubeUrl}
      />

      {errorMessage ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/25 bg-destructive/[0.06] p-4 text-sm leading-6 text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}

      {job ? (
        <ConversionStatusCard
          isDownloading={isDownloading}
          job={job}
          onDownload={downloadResult}
        />
      ) : null}

      <RecentConversionsCard
        isLoading={isLoadingJobs}
        jobs={recentJobs}
        onSelect={setJob}
        selectedJobId={job?.id}
      />
    </div>
  );
}
