import type {
  JobApplicationQaItem,
  JobApplicationStatus,
  JobListingFilters,
  JobListingsResponse,
  JobPriority,
} from "@/lib/types";

export async function fetchListings(filters: JobListingFilters): Promise<JobListingsResponse> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === "" || v === false) continue;
    if (v === true) {
      params.set(k, "true");
    } else {
      params.set(k, String(v));
    }
  }
  const res = await fetch(`/api/jobs/listings?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function setListingStatus(
  listingId: string,
  status: JobApplicationStatus | null,
  extras?: {
    notes?: string;
    priority?: JobPriority;
    next_action_at?: string | null;
    next_action_note?: string | null;
  }
) {
  const res = await fetch(`/api/jobs/listings/${listingId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, ...extras }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function addQuestion(
  listingId: string,
  question: string,
  extras?: { answer?: string; category?: string }
): Promise<{ data: JobApplicationQaItem[] }> {
  const res = await fetch(`/api/jobs/listings/${listingId}/qa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, ...(extras ?? {}) }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function updateQuestion(
  listingId: string,
  index: number,
  patch: Partial<JobApplicationQaItem>
): Promise<{ data: JobApplicationQaItem[] }> {
  const res = await fetch(`/api/jobs/listings/${listingId}/qa`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index, patch }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function deleteQuestion(
  listingId: string,
  index: number
): Promise<{ data: JobApplicationQaItem[] }> {
  const res = await fetch(`/api/jobs/listings/${listingId}/qa?index=${index}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function toggleSource(sourceId: string, is_active: boolean) {
  const res = await fetch(`/api/jobs/sources/${sourceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
