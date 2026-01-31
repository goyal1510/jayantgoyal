import type { ShortUrl } from "@/lib/types";

export async function fetchUrls(): Promise<ShortUrl[]> {
  const res = await fetch("/api/urls");
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to fetch URLs");
  }
  const { data } = await res.json();
  return data;
}

export async function createUrl(
  body: Pick<ShortUrl, "slug" | "target_url" | "title" | "is_active">
): Promise<ShortUrl> {
  const res = await fetch("/api/urls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to create URL");
  }
  const { data } = await res.json();
  return data;
}

export async function updateUrl(
  id: string,
  body: Partial<Pick<ShortUrl, "slug" | "target_url" | "title" | "is_active">>
): Promise<ShortUrl> {
  const res = await fetch(`/api/urls/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to update URL");
  }
  const { data } = await res.json();
  return data;
}

export async function deleteUrl(id: string): Promise<void> {
  const res = await fetch(`/api/urls/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete URL");
  }
}
