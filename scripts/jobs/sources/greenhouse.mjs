import { normalize } from "../lib/normalize.mjs";

// Greenhouse Job Board API — https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true
// One source row per company. config.company holds the slug.

export async function fetchGreenhouse(source) {
  const slug = source?.config?.company ?? source.label;
  const companyName = source?.config?.name ?? slug;
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`;

  const res = await fetch(url, {
    headers: { "User-Agent": "jayantgoyal-jobs-aggregator/1.0" },
  });
  if (!res.ok) throw new Error(`Greenhouse ${slug} HTTP ${res.status}`);
  const data = await res.json();
  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];

  return jobs.map((j) => {
    const location = j.location?.name ?? null;
    const remoteHint = /remote/i.test(location ?? "") || /remote/i.test(j.title ?? "");
    return normalize({
      source_kind: "greenhouse",
      external_id: String(j.id),
      title: j.title,
      company: companyName,
      location,
      remote_hint: remoteHint,
      salary_hint: null, // Greenhouse rarely exposes salary; ignore
      description_html: j.content,
      apply_url: j.absolute_url,
      tags: (j.metadata ?? []).map((m) => `${m.name}:${m.value}`).filter(Boolean),
      posted_at: j.updated_at ?? j.first_published ?? null,
      raw: j,
    });
  });
}
