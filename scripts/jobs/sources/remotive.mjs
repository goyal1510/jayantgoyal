import { normalize } from "../lib/normalize.mjs";

// Remotive public API — https://remotive.com/api/remote-jobs
// No auth, no API key. Soft cap ~50 req/day. Attribution required.
// We fetch the software-dev category and let the UI filter by criteria.

const ENDPOINT = "https://remotive.com/api/remote-jobs";

export async function fetchRemotive(source) {
  const cat = source?.config?.category ?? "software-dev";
  const url = `${ENDPOINT}?category=${encodeURIComponent(cat)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "jayantgoyal-jobs-aggregator/1.0 (personal use)" },
  });
  if (!res.ok) {
    throw new Error(`Remotive HTTP ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];

  return jobs.map((j) =>
    normalize({
      source_kind: "remotive",
      external_id: j.id ?? j.url,
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location ?? "Worldwide",
      remote_hint: true,
      salary_hint: j.salary,
      description_html: j.description,
      apply_url: j.url,
      tags: Array.isArray(j.tags) ? j.tags : [],
      posted_at: j.publication_date ?? null,
      raw: j,
    })
  );
}
