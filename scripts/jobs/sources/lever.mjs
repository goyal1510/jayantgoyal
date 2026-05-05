import { normalize } from "../lib/normalize.mjs";

// Lever public postings — https://api.lever.co/v0/postings/{slug}?mode=json
// One source row per company.

export async function fetchLever(source) {
  const slug = source?.config?.company ?? source.label;
  const companyName = source?.config?.name ?? slug;
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;

  const res = await fetch(url, {
    headers: { "User-Agent": "jayantgoyal-jobs-aggregator/1.0" },
  });
  if (!res.ok) throw new Error(`Lever ${slug} HTTP ${res.status}`);
  const data = await res.json();
  const jobs = Array.isArray(data) ? data : [];

  return jobs.map((j) => {
    const location = j.categories?.location ?? null;
    const workplace = (j.workplaceType ?? "").toLowerCase();
    const remoteHint = workplace === "remote" || /remote/i.test(location ?? "");
    const tags = [
      j.categories?.team,
      j.categories?.department,
      j.categories?.commitment,
    ].filter(Boolean);

    return normalize({
      source_kind: "lever",
      external_id: String(j.id),
      title: j.text,
      company: companyName,
      location,
      remote_hint: remoteHint,
      salary_hint: j.salaryRange
        ? `${j.salaryRange.currency ?? ""} ${j.salaryRange.min ?? ""}-${j.salaryRange.max ?? ""}`.trim()
        : null,
      description_html: j.descriptionHtml ?? j.description,
      apply_url: j.hostedUrl ?? j.applyUrl,
      tags,
      posted_at: j.createdAt ? new Date(j.createdAt).toISOString() : null,
      raw: j,
    });
  });
}
