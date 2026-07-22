export const CONVERSION_QUALITIES = [
  { id: "small", label: "Small", mp3Detail: "128 kbps", mp4Detail: "480p" },
  {
    id: "balanced",
    label: "Balanced",
    mp3Detail: "192 kbps",
    mp4Detail: "720p",
  },
  { id: "high", label: "High", mp3Detail: "320 kbps", mp4Detail: "1080p" },
] as const;

export const MEDIA_CONVERSION_ACTIVE_STATUSES = [
  "queued",
  "downloading",
  "converting",
  "uploading",
] as const;

export type ConversionQuality = (typeof CONVERSION_QUALITIES)[number]["id"];
export type OutputFormat = "mp3" | "mp4";
export type YouTubeLinkKind = "short" | "video";
export type MediaConversionStatus =
  | (typeof MEDIA_CONVERSION_ACTIVE_STATUSES)[number]
  | "completed"
  | "failed"
  | "expired";

export type MediaConversionJob = {
  id: string;
  sourceUrl: string;
  outputFormat: OutputFormat;
  quality: ConversionQuality;
  status: MediaConversionStatus;
  progress: number;
  title: string | null;
  outputFilename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
};

export type MediaConversionJobRow = {
  id: string;
  source_url: string;
  output_format: OutputFormat;
  quality: ConversionQuality;
  status: MediaConversionStatus;
  progress: number;
  title: string | null;
  output_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
};

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
]);
const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{6,32}$/;

function getYouTubeVideoId(url: URL) {
  if (url.hostname.toLowerCase() === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments[0] === "watch") return url.searchParams.get("v");
  if (segments[0] === "shorts" || segments[0] === "live") {
    return segments[1] ?? null;
  }
  return null;
}

export function classifyYouTubeUrl(value: string): YouTubeLinkKind | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;

    const videoId = getYouTubeVideoId(url);
    if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) return null;
    return url.pathname.split("/").filter(Boolean)[0] === "shorts"
      ? "short"
      : "video";
  } catch {
    return null;
  }
}

export function normalizeYouTubeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const videoId = getYouTubeVideoId(url);
    if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) return null;
    return `https://www.youtube.com/watch?v=${videoId}`;
  } catch {
    return null;
  }
}

export function isOutputFormat(value: unknown): value is OutputFormat {
  return value === "mp3" || value === "mp4";
}

export function isConversionQuality(
  value: unknown,
): value is ConversionQuality {
  return CONVERSION_QUALITIES.some((quality) => quality.id === value);
}

export function isActiveMediaConversionStatus(status: MediaConversionStatus) {
  return MEDIA_CONVERSION_ACTIVE_STATUSES.some((active) => active === status);
}

export function toMediaConversionJob(
  row: MediaConversionJobRow,
): MediaConversionJob {
  return {
    id: row.id,
    sourceUrl: row.source_url,
    outputFormat: row.output_format,
    quality: row.quality,
    status: row.status,
    progress: row.progress,
    title: row.title,
    outputFilename: row.output_filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    expiresAt: row.expires_at,
  };
}

export function formatMediaFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
