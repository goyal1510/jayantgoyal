/** Server-only access and worker wake controls for Media Lab. */
type MediaConverterUser = {
  id: string;
  email?: string | null;
};

type MediaConverterAccessConfig = {
  allowedEmails?: string;
  allowedUserIds?: string;
  isProduction?: boolean;
};

type MediaWorkerWakeConfig = {
  fetcher?: typeof fetch;
  timeoutMs?: number;
  token?: string;
  url?: string;
};

function isLocalStudioUrl(value: string | undefined) {
  try {
    const hostname = new URL(value ?? "").hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function parseAllowlist(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isMediaConverterUserAllowed(
  user: MediaConverterUser,
  config: MediaConverterAccessConfig = {
    allowedEmails: process.env.MEDIA_CONVERTER_ALLOWED_EMAILS,
    allowedUserIds: process.env.MEDIA_CONVERTER_ALLOWED_USER_IDS,
    isProduction: !isLocalStudioUrl(process.env.NEXT_PUBLIC_STUDIO_URL),
  },
) {
  const allowedEmails = parseAllowlist(config.allowedEmails);
  const allowedUserIds = parseAllowlist(config.allowedUserIds);
  const hasAllowlist = allowedEmails.size > 0 || allowedUserIds.size > 0;

  if (!hasAllowlist) return config.isProduction !== true;

  return (
    allowedUserIds.has(user.id.toLowerCase()) ||
    (Boolean(user.email) && allowedEmails.has(user.email!.toLowerCase()))
  );
}

export async function wakeMediaWorker(
  config: MediaWorkerWakeConfig = {
    token: process.env.MEDIA_WORKER_WAKE_TOKEN,
    url: process.env.MEDIA_WORKER_WAKE_URL,
  },
) {
  const url = config.url?.trim();
  if (!url) return false;

  const token = config.token?.trim();

  try {
    const response = await (config.fetcher ?? fetch)(url, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      method: "GET",
      signal: AbortSignal.timeout(config.timeoutMs ?? 30_000),
    });

    if (!response.ok) {
      console.warn(
        `Media worker wake request returned status ${response.status}.`,
      );
      return false;
    }

    return true;
  } catch {
    console.warn("Media worker wake request did not complete.");
    return false;
  }
}
