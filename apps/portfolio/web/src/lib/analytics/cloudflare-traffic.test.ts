import { describe, expect, it } from "vitest";

import {
  calculateCachedPercent,
  formatBytes,
  parseTrafficRange,
} from "@/lib/analytics/cloudflare-traffic";
import {
  getWebVitalRating,
  normalizeRumDuration,
} from "@/lib/analytics/cloudflare-rum";
import { getRumQueryWindow } from "@/lib/analytics/cloudflare-rum-server";
import { getTrafficQueryWindow } from "@/lib/analytics/cloudflare-server";

describe("Cloudflare traffic presentation", () => {
  it("accepts only supported public ranges", () => {
    expect(parseTrafficRange("7d")).toBe("7d");
    expect(parseTrafficRange(["30d", "24h"])).toBe("30d");
    expect(parseTrafficRange("90d")).toBe("24h");
  });

  it("calculates cached bandwidth safely", () => {
    expect(calculateCachedPercent(200, 50)).toBe(25);
    expect(calculateCachedPercent(0, 0)).toBe(0);
  });

  it("formats decimal bandwidth units used by Cloudflare", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(57_440_876)).toBe("57.4 MB");
  });

  it("normalizes Cloudflare RUM duration aggregates to milliseconds", () => {
    expect(normalizeRumDuration(2_700_000)).toBe(2700);
    expect(normalizeRumDuration(-1)).toBeNull();
    expect(normalizeRumDuration(null)).toBeNull();
  });

  it("rates field metrics against published experience thresholds", () => {
    expect(getWebVitalRating("lcp", 2500)).toBe("good");
    expect(getWebVitalRating("lcp", 2700)).toBe("needs-improvement");
    expect(getWebVitalRating("fcp", 4168)).toBe("poor");
    expect(getWebVitalRating("inp", 24)).toBe("good");
    expect(getWebVitalRating("cls", null)).toBe("unknown");
  });

  it("uses completed hours for the 24-hour view", () => {
    const window = getTrafficQueryWindow(
      "24h",
      new Date("2026-09-14T03:37:22.000Z"),
    );

    expect(window.start).toBe("2026-09-13T03:00:00.000Z");
    expect(window.end).toBe("2026-09-14T03:00:00.000Z");
    expect(window.granularity).toBe("hour");
  });

  it("uses inclusive calendar days for longer views", () => {
    const window = getTrafficQueryWindow(
      "30d",
      new Date("2026-09-14T03:37:22.000Z"),
    );

    expect(window.start).toBe("2026-08-16");
    expect(window.end).toBe("2026-09-14");
    expect(window.granularity).toBe("day");
  });

  it("uses complete UTC days for 30-day RUM trends", () => {
    const window = getRumQueryWindow(
      "30d",
      new Date("2026-09-14T03:37:22.000Z"),
    );

    expect(window.start).toBe("2026-08-16T00:00:00.000Z");
    expect(window.end).toBe("2026-09-15T00:00:00.000Z");
    expect(window.granularity).toBe("day");
  });
});
