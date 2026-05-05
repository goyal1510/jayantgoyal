// Shared normalizer — converts source-specific job objects into the
// canonical shape that maps to jg_app.job_listings columns.
//
// Returns: {
//   external_id, title, company, location, is_remote, is_india,
//   salary_text, salary_min_inr, salary_max_inr, salary_currency,
//   description_html, description_text, apply_url, tags, posted_at, raw
// }

const INDIA_RE = /\b(india|bangalore|bengaluru|mumbai|delhi|gurgaon|gurugram|noida|hyderabad|pune|chennai|kolkata|ahmedabad|jaipur|kochi|trivandrum|thiruvananthapuram|indore|nagpur)\b/i;
const REMOTE_RE = /\b(remote|anywhere|distributed|work from home|wfh)\b/i;
const GLOBAL_REMOTE_RE = /\b(worldwide|anywhere|global|international|any country)\b/i;
const EXCLUDES_INDIA_RE = /\b(us only|usa only|uk only|canada only|americas only|europe only|emea only|us-based|usa-based|north america only)\b/i;

const USD_INR = 84;
const EUR_INR = 92;
const GBP_INR = 107;
const CAD_INR = 62;

function detectIndia(...texts) {
  return texts.filter(Boolean).some((t) => INDIA_RE.test(t));
}

function detectRemote(...texts) {
  return texts.filter(Boolean).some((t) => REMOTE_RE.test(t));
}

function stripHtml(html) {
  if (!html) return null;
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSalary(text) {
  if (!text) return { salary_text: null, min: null, max: null, currency: null };
  const t = String(text);
  const currency =
    /₹|inr|rupee|lakh|lpa|crore/i.test(t) ? "INR" :
    /\$|usd/i.test(t) ? "USD" :
    /€|eur/i.test(t) ? "EUR" :
    /£|gbp/i.test(t) ? "GBP" :
    /cad/i.test(t) ? "CAD" : null;

  const lakhs = [...t.matchAll(/(\d+(?:\.\d+)?)\s*(?:lakh|lpa|lacs|l\b)/gi)]
    .map((m) => Math.round(parseFloat(m[1]) * 100000));
  const crores = [...t.matchAll(/(\d+(?:\.\d+)?)\s*crore/gi)]
    .map((m) => Math.round(parseFloat(m[1]) * 10000000));

  // Match numbers with optional thousands separator and optional k/K suffix.
  // Examples: "20k", "120,000", "100K", "$50000".
  const numbers = [...t.matchAll(/(\d{1,3}(?:[,_]\d{3})+|\d+)(\s*[kK]\b)?/g)]
    .map((m) => {
      const n = parseInt(m[1].replace(/[,_]/g, ""), 10);
      return m[2] ? n * 1000 : n;
    })
    .filter((n) => n >= 1000); // ignore years, hours, small numbers

  let all = [...lakhs, ...crores];
  if (all.length === 0) all = numbers;

  if (all.length === 0) {
    return { salary_text: t, min: null, max: null, currency };
  }

  const min = Math.min(...all);
  const max = Math.max(...all);

  const rate =
    currency === "USD" ? USD_INR :
    currency === "EUR" ? EUR_INR :
    currency === "GBP" ? GBP_INR :
    currency === "CAD" ? CAD_INR :
    1; // INR or unknown — assume already in INR-equivalent magnitude

  return {
    salary_text: t,
    min: Math.round(min * rate),
    max: Math.round(max * rate),
    currency: currency ?? "USD",
  };
}

export function normalize({
  source_kind,
  external_id,
  title,
  company,
  location,
  remote_hint,
  salary_hint,
  description_html,
  apply_url,
  tags = [],
  posted_at,
  raw,
}) {
  const desc_text = stripHtml(description_html);
  const is_remote = !!remote_hint || detectRemote(location, title, desc_text);
  const explicitlyIndia = detectIndia(location, desc_text, title);
  const excludesIndia = [location, desc_text].filter(Boolean).some((t) => EXCLUDES_INDIA_RE.test(t));
  const globalRemote = is_remote &&
    [location, desc_text].filter(Boolean).some((t) => GLOBAL_REMOTE_RE.test(t)) &&
    !excludesIndia;
  const is_india = explicitlyIndia || globalRemote;
  const salary = parseSalary(salary_hint);

  return {
    external_id: String(external_id),
    title: title?.trim() ?? "(untitled)",
    company: company?.trim() ?? "(unknown)",
    location: location?.trim() ?? null,
    is_remote,
    is_india,
    salary_text: salary.salary_text,
    salary_min_inr: salary.min,
    salary_max_inr: salary.max,
    salary_currency: salary.currency,
    description_html: description_html ?? null,
    description_text: desc_text,
    apply_url: apply_url ?? null,
    tags: Array.isArray(tags) ? tags.map(String) : [],
    posted_at: posted_at ?? null,
    raw: raw ?? null,
  };
}
