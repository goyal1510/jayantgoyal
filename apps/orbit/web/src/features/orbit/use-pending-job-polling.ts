"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type JobLike = {
  status?: unknown;
};

const ACTIVE_STATUSES = new Set(["pending", "processing"]);

/** Refreshes server data while export/import jobs are still running. */
export function usePendingJobPolling(jobs: JobLike[], intervalMs = 4000) {
  const router = useRouter();
  const hasActiveJobs = jobs.some((job) => ACTIVE_STATUSES.has(String(job.status ?? "")));

  useEffect(() => {
    if (!hasActiveJobs) return undefined;

    const timer = window.setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [hasActiveJobs, intervalMs, router]);
}
