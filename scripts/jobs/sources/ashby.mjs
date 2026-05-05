import { normalize } from "../lib/normalize.mjs";

// Ashby public job board API — https://api.ashbyhq.com/posting-api/job-board/{org}
// No auth required. Returns { jobs: [{id, title, department, team, location,
// secondaryLocations, isRemote, workplaceType, address, applyUrl, jobUrl,
// publishedAt, descriptionHtml, descriptionPlain, ...}], apiVersion }
//
// One source row per company (config.company = ashby org slug).

export async function fetchAshby(source) {
  const slug = source?.config?.company ?? source.label;
  const companyName = source?.config?.name ?? slug;
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "jayantgoyal-jobs-aggregator/1.0" },
  });
  if (!res.ok) throw new Error(`Ashby ${slug} HTTP ${res.status}`);
  const data = await res.json();
  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];

  return jobs
    .filter((j) => j.isListed !== false)
    .map((j) => {
      // Ashby's `location` is usually a single string ("Bangalore", "Remote",
      // "Worldwide"). secondaryLocations may have alternates.
      const locStrings = [
        j.location,
        ...(Array.isArray(j.secondaryLocations) ? j.secondaryLocations : []).map(
          (l) => (typeof l === "string" ? l : l?.location ?? null)
        ),
      ].filter(Boolean);
      const location = locStrings.join(" / ") || null;

      const tags = [j.department, j.team, j.employmentType, j.workplaceType]
        .filter(Boolean)
        .map(String);

      return normalize({
        source_kind: "ashby",
        external_id: String(j.id),
        title: j.title,
        company: companyName,
        location,
        remote_hint: !!j.isRemote || /remote/i.test(j.workplaceType ?? ""),
        salary_hint: j.compensationTierSummary ?? null,
        description_html: j.descriptionHtml ?? j.descriptionPlain ?? null,
        apply_url: j.applyUrl ?? j.jobUrl,
        tags,
        posted_at: j.publishedAt ?? null,
        raw: j,
      });
    });
}
