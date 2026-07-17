import { rewriteApplicationUrl } from "@repo/platform";

export function resolveProjectUrl(value: string): string {
  return rewriteApplicationUrl({
    value,
    sourceApps: ["portfolio"],
    targetApp: "studio",
    targetOrigin: process.env.NEXT_PUBLIC_STUDIO_URL,
  });
}
