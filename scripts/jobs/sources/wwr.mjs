import { normalize } from "../lib/normalize.mjs";

// WeWorkRemotely RSS — https://weworkremotely.com/categories/remote-programming-jobs.rss
// Tiny inline RSS parser (no deps). Each <item> has title, description, link,
// pubDate, region, guid.

const FEED_BASE = "https://weworkremotely.com/categories";

function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function extractCdata(text) {
  if (!text) return text;
  const m = text.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return m ? m[1] : text;
}

function parseItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const get = (tag) => {
      const r = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`).exec(block);
      return r ? decodeEntities(extractCdata(r[1]).trim()) : null;
    };
    items.push({
      title: get("title"),
      description: get("description"),
      link: get("link"),
      pubDate: get("pubDate"),
      region: get("region"),
      guid: get("guid"),
    });
  }
  return items;
}

function splitTitle(title) {
  // WWR titles are typically "Company: Job Title"
  if (!title) return { company: null, jobTitle: title };
  const idx = title.indexOf(":");
  if (idx <= 0) return { company: null, jobTitle: title };
  return { company: title.slice(0, idx).trim(), jobTitle: title.slice(idx + 1).trim() };
}

export async function fetchWwr(source) {
  const cat = source?.config?.category ?? "remote-programming-jobs";
  const url = `${FEED_BASE}/${cat}.rss`;

  const res = await fetch(url, {
    headers: { "User-Agent": "jayantgoyal-jobs-aggregator/1.0" },
  });
  if (!res.ok) throw new Error(`WWR HTTP ${res.status}`);
  const xml = await res.text();
  const items = parseItems(xml);

  return items.map((it) => {
    const { company, jobTitle } = splitTitle(it.title);
    return normalize({
      source_kind: "wwr",
      external_id: it.guid ?? it.link,
      title: jobTitle ?? it.title,
      company: company ?? "(unknown)",
      location: it.region ?? "Remote",
      remote_hint: true,
      salary_hint: null,
      description_html: it.description,
      apply_url: it.link,
      tags: [],
      posted_at: it.pubDate ? new Date(it.pubDate).toISOString() : null,
      raw: it,
    });
  });
}
