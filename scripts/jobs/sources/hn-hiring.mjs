import { normalize } from "../lib/normalize.mjs";

// Hacker News "Ask HN: Who is hiring?" — monthly thread.
// Firebase API:
//   https://hacker-news.firebaseio.com/v0/user/whoishiring/submitted.json
//   https://hacker-news.firebaseio.com/v0/item/{id}.json
//
// Phase 1: regex-based extraction (no Claude API). HN comments loosely follow
// "Company | Title | Location | Remote/Onsite | Tech | Apply".

const HN_BASE = "https://hacker-news.firebaseio.com/v0";
const FETCH_CONCURRENCY = 20;

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HN HTTP ${res.status}`);
  return res.json();
}

async function findLatestHiringThread() {
  const submitted = await fetchJson(`${HN_BASE}/user/whoishiring/submitted.json`);
  for (const id of submitted) {
    const item = await fetchJson(`${HN_BASE}/item/${id}.json`);
    if (item && /ask hn: who is hiring/i.test(item.title ?? "")) {
      return item;
    }
  }
  return null;
}

async function pool(items, n, fn) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFirstLine(text) {
  // Try to extract company / title / location from the first chunk before any "."
  // Common formats:
  //   "ACME (https://acme.com) | Senior Engineer | Remote | Bangalore"
  //   "ACME | London/Remote | Full Stack | acme.com/jobs"
  const head = text.split(/[.\n]/)[0]?.slice(0, 250) ?? "";
  const parts = head.split("|").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { company: null, title: null };
  const company = parts[0].replace(/\([^)]*\)/g, "").trim().slice(0, 120);
  const title =
    parts.find((p) => /engineer|developer|designer|manager|lead|architect|scientist|analyst|founder|cto|vp/i.test(p)) ??
    parts[1] ??
    null;
  return { company: company || null, title: title || null };
}

function extractApplyUrl(text) {
  const m = text.match(/https?:\/\/[^\s"'<>)]+/);
  return m ? m[0].replace(/[.,;:]+$/, "") : null;
}

export async function fetchHnHiring(source) {
  const thread = await findLatestHiringThread();
  if (!thread) {
    console.log("  [hn] no Who-is-hiring thread found");
    return [];
  }
  console.log(`  [hn] thread: "${thread.title}" (${thread.kids?.length ?? 0} top comments)`);

  const ids = (thread.kids ?? []).slice(0, 500); // cap for safety
  const comments = await pool(ids, FETCH_CONCURRENCY, async (id) => {
    try {
      return await fetchJson(`${HN_BASE}/item/${id}.json`);
    } catch {
      return null;
    }
  });

  const valid = comments.filter((c) => c && !c.deleted && !c.dead && c.text);
  console.log(`  [hn] ${valid.length} valid comments`);

  return valid.map((c) => {
    const text = stripHtml(c.text);
    const { company, title } = parseFirstLine(text);
    const applyUrl = extractApplyUrl(c.text) ?? `https://news.ycombinator.com/item?id=${c.id}`;
    return normalize({
      source_kind: "hn_hiring",
      external_id: String(c.id),
      title: title ?? "(see description)",
      company: company ?? "(see description)",
      location: null,
      remote_hint: undefined,
      salary_hint: null,
      description_html: c.text,
      apply_url: applyUrl,
      tags: [`hn-thread-${thread.id}`],
      posted_at: c.time ? new Date(c.time * 1000).toISOString() : null,
      raw: { thread_id: thread.id, ...c },
    });
  });
}
