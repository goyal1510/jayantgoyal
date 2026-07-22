import { describe, expect, it, vi } from "vitest";

import {
  classifyYouTubeUrl,
  formatMediaFileSize,
  isActiveMediaConversionStatus,
  isConversionQuality,
  isOutputFormat,
  normalizeYouTubeUrl,
  toMediaConversionJob,
} from "@/lib/media-lab/youtube-converter";
import {
  isMediaConverterUserAllowed,
  wakeMediaWorker,
} from "@/lib/media-lab/youtube-converter.server";

describe("YouTube converter", () => {
  it("recognizes and normalizes YouTube videos, Shorts, and compact links", () => {
    expect(
      classifyYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("video");
    expect(classifyYouTubeUrl("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "short",
    );
    expect(classifyYouTubeUrl("https://youtu.be/dQw4w9WgXcQ?t=10")).toBe(
      "video",
    );
    expect(normalizeYouTubeUrl("https://youtu.be/dQw4w9WgXcQ?t=10")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
  });

  it("rejects non-video and deceptive URLs", () => {
    expect(classifyYouTubeUrl("https://youtube.com/feed/subscriptions")).toBe(
      null,
    );
    expect(
      classifyYouTubeUrl("https://youtube.com.example.test/watch?v=abc12345"),
    ).toBe(null);
    expect(classifyYouTubeUrl("file:///tmp/video.mp4")).toBe(null);
  });

  it("validates public job options and active states", () => {
    expect(isOutputFormat("mp3")).toBe(true);
    expect(isOutputFormat("wav")).toBe(false);
    expect(isConversionQuality("balanced")).toBe(true);
    expect(isConversionQuality("lossless")).toBe(false);
    expect(isActiveMediaConversionStatus("uploading")).toBe(true);
    expect(isActiveMediaConversionStatus("completed")).toBe(false);
  });

  it("maps database rows without exposing storage paths or user ids", () => {
    const job = toMediaConversionJob({
      id: "job-id",
      source_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      output_format: "mp3",
      quality: "balanced",
      status: "completed",
      progress: 100,
      title: "Sample",
      output_filename: "sample.mp3",
      mime_type: "audio/mpeg",
      size_bytes: 1024,
      error_message: null,
      created_at: "2026-07-22T00:00:00Z",
      completed_at: "2026-07-22T00:01:00Z",
      expires_at: "2026-07-22T01:01:00Z",
    });

    expect(job).toMatchObject({ id: "job-id", outputFormat: "mp3" });
    expect(job).not.toHaveProperty("storagePath");
    expect(formatMediaFileSize(job.sizeBytes!)).toBe("1.0 KB");
  });

  it("fails closed in production and supports email or user-id allowlists", () => {
    const user = { id: "USER-1", email: "owner@example.com" };

    expect(isMediaConverterUserAllowed(user, { isProduction: true })).toBe(
      false,
    );
    expect(
      isMediaConverterUserAllowed(user, {
        allowedEmails: "OWNER@example.com",
        isProduction: true,
      }),
    ).toBe(true);
    expect(
      isMediaConverterUserAllowed(user, {
        allowedUserIds: "user-1",
        isProduction: true,
      }),
    ).toBe(true);
    expect(isMediaConverterUserAllowed(user, { isProduction: false })).toBe(
      true,
    );
  });

  it("wakes a private worker with a server-only bearer token", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 200 }));

    await expect(
      wakeMediaWorker({
        fetcher,
        timeoutMs: 100,
        token: "private-token",
        url: "https://owner-worker.example/healthz",
      }),
    ).resolves.toBe(true);
    expect(fetcher).toHaveBeenCalledWith(
      "https://owner-worker.example/healthz",
      expect.objectContaining({
        headers: { Authorization: "Bearer private-token" },
        method: "GET",
      }),
    );
  });

  it("skips worker wake-up when no hosted worker is configured", async () => {
    const fetcher = vi.fn();

    await expect(wakeMediaWorker({ fetcher })).resolves.toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
