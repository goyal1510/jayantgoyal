// Candidate companies for Greenhouse + Lever ingestion.
// `seed-companies.mjs` probes each ATS endpoint and inserts the working ones
// into job_sources. `ats: "auto"` means try greenhouse first then lever.
//
// Slugs are best-effort. Re-run seed-companies.mjs after adding entries.

export const COMPANIES = [
  // International with strong India presence / India-remote-friendly
  { slug: "stripe", name: "Stripe", ats: "auto" },
  { slug: "atlassian", name: "Atlassian", ats: "auto" },
  { slug: "airbnb", name: "Airbnb", ats: "auto" },
  { slug: "uber", name: "Uber", ats: "auto" },
  { slug: "vercel", name: "Vercel", ats: "auto" },
  { slug: "supabase", name: "Supabase", ats: "auto" },
  { slug: "linear", name: "Linear", ats: "auto" },
  { slug: "ramp", name: "Ramp", ats: "auto" },
  { slug: "planetscale", name: "PlanetScale", ats: "auto" },
  { slug: "retool", name: "Retool", ats: "auto" },
  { slug: "scaleai", name: "Scale AI", ats: "auto" },
  { slug: "scale", name: "Scale AI (alt)", ats: "auto" },
  { slug: "replit", name: "Replit", ats: "auto" },
  { slug: "cloudflare", name: "Cloudflare", ats: "auto" },
  { slug: "gitlab", name: "GitLab", ats: "auto" },
  { slug: "hashicorp", name: "HashiCorp", ats: "auto" },
  { slug: "hubspot", name: "HubSpot", ats: "auto" },
  { slug: "doordash", name: "DoorDash", ats: "auto" },
  { slug: "pinterest", name: "Pinterest", ats: "auto" },
  { slug: "reddit", name: "Reddit", ats: "auto" },
  { slug: "figma", name: "Figma", ats: "auto" },
  { slug: "notion", name: "Notion", ats: "auto" },
  { slug: "datadog", name: "Datadog", ats: "auto" },
  { slug: "intercom", name: "Intercom", ats: "auto" },
  { slug: "elastic", name: "Elastic", ats: "auto" },
  { slug: "mongodb", name: "MongoDB", ats: "auto" },
  { slug: "twilio", name: "Twilio", ats: "auto" },

  // India-headquartered or India-first
  { slug: "razorpay", name: "Razorpay", ats: "auto" },
  { slug: "razorpaysoftware", name: "Razorpay (alt)", ats: "auto" },
  { slug: "cred", name: "CRED", ats: "auto" },
  { slug: "dreamsports", name: "Dream Sports / Dream11", ats: "auto" },
  { slug: "postman", name: "Postman", ats: "auto" },
  { slug: "freshworks", name: "Freshworks", ats: "auto" },
  { slug: "zomato", name: "Zomato", ats: "auto" },
  { slug: "swiggy", name: "Swiggy", ats: "auto" },
  { slug: "groww", name: "Groww", ats: "auto" },
  { slug: "phonepe", name: "PhonePe", ats: "auto" },
  { slug: "meesho", name: "Meesho", ats: "auto" },
  { slug: "zerodha", name: "Zerodha", ats: "auto" },
  { slug: "unacademy", name: "Unacademy", ats: "auto" },
  { slug: "cars24", name: "Cars24", ats: "auto" },
  { slug: "innovaccer", name: "Innovaccer", ats: "auto" },
  { slug: "browserstack", name: "BrowserStack", ats: "auto" },

  // Ashby ATS — verified working orgs (2026-05)
  { slug: "linear", name: "Linear", ats: "ashby" },
  { slug: "notion", name: "Notion", ats: "ashby" },
  { slug: "replit", name: "Replit", ats: "ashby" },
  { slug: "supabase", name: "Supabase", ats: "ashby" },
  { slug: "ramp", name: "Ramp", ats: "ashby" },
  { slug: "ashby", name: "Ashby", ats: "ashby" },
  { slug: "openai", name: "OpenAI", ats: "ashby" },
  { slug: "deel", name: "Deel", ats: "ashby" },
  { slug: "cohere", name: "Cohere", ats: "ashby" },
  { slug: "perplexity", name: "Perplexity", ats: "ashby" },
  { slug: "mistral", name: "Mistral AI", ats: "ashby" },
  { slug: "wealthsimple", name: "Wealthsimple", ats: "ashby" },
  { slug: "posthog", name: "PostHog", ats: "ashby" },
  { slug: "modal", name: "Modal Labs", ats: "ashby" },
  { slug: "pinecone", name: "Pinecone", ats: "ashby" },
  { slug: "weaviate", name: "Weaviate", ats: "ashby" },
  { slug: "railway", name: "Railway", ats: "ashby" },
];

export const ATS_PROBES = {
  greenhouse: (slug) =>
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs`,
  ashby: (slug) =>
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`,
  lever: (slug) =>
    `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`,
};
