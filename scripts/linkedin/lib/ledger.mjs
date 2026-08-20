import { getSupabaseConfig } from "./config.mjs";
import { getDatabaseAccessToken } from "./database-session.mjs";
import { linkedinPostUrl } from "./history.mjs";

async function requestLedger(
  pathname,
  { method = "GET", body, prefer } = {},
  {
    fetchImplementation = fetch,
    accessTokenProvider = getDatabaseAccessToken,
  } = {},
) {
  const { url, anonKey } = getSupabaseConfig();
  const accessToken = await accessTokenProvider(fetchImplementation);
  const response = await fetchImplementation(`${url}/rest/v1/${pathname}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Accept-Profile": "portfolio",
      ...(method !== "GET" && { "Content-Profile": "portfolio" }),
      ...(body && { "Content-Type": "application/json" }),
      ...(prefer && { Prefer: prefer }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  const responseText = await response.text();
  let payload = null;
  try {
    payload = responseText ? JSON.parse(responseText) : null;
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const detail = payload?.message ?? payload?.hint ?? responseText;
    throw new Error(
      `LinkedIn ledger request failed (${response.status})${detail ? `: ${detail}` : "."}`,
    );
  }
  return payload;
}

export async function createLedgerPost(input, dependencies) {
  const [record] = await requestLedger(
    "linkedin_posts?select=*",
    {
      method: "POST",
      prefer: "return=representation",
      body: {
        status: input.status ?? "planned",
        topic: input.topic ?? null,
        content: input.content,
        article_url: input.articleUrl ?? null,
        writing_slug: input.writingSlug ?? null,
        scheduled_for: input.scheduledFor ?? null,
        replaces_id: input.replacesId ?? null,
      },
    },
    dependencies,
  );
  return record;
}

export async function updateLedgerPost(id, patch, dependencies) {
  const [record] = await requestLedger(
    `linkedin_posts?id=eq.${encodeURIComponent(id)}&select=*`,
    {
      method: "PATCH",
      prefer: "return=representation",
      body: patch,
    },
    dependencies,
  );
  if (!record) throw new Error(`LinkedIn ledger record ${id} was not found.`);
  return record;
}

export async function getLedgerPost(id, dependencies) {
  const records = await requestLedger(
    `linkedin_posts?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
    {},
    dependencies,
  );
  if (!records[0])
    throw new Error(`LinkedIn ledger record ${id} was not found.`);
  return records[0];
}

export function listLedgerPosts({ queueOnly = false } = {}, dependencies) {
  const filter = queueOnly
    ? "&status=in.(planned,scheduled,failed)&order=scheduled_for.asc.nullslast,created_at.asc"
    : "&order=created_at.desc";
  return requestLedger(`linkedin_posts?select=*${filter}`, {}, dependencies);
}

async function upsertPublishedPost(input, dependencies) {
  const [record] = await requestLedger(
    "linkedin_posts?on_conflict=linkedin_post_urn&select=*",
    {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=representation",
      body: input,
    },
    dependencies,
  );
  return record;
}

export function publishedLedgerPatch(
  postUrn,
  publishedAt = new Date().toISOString(),
) {
  return {
    status: "published",
    linkedin_post_urn: postUrn,
    linkedin_post_url: linkedinPostUrl(postUrn),
    published_at: publishedAt,
    deleted_at: null,
    publication_error: null,
  };
}

export function localPostLedgerPayload(post) {
  const status = post.deleted
    ? post.editedTo
      ? "replaced"
      : "deleted"
    : "published";
  return {
    status,
    topic: post.topic ?? null,
    content: post.text,
    article_url: post.url ?? null,
    writing_slug: post.writingSlug ?? post.blogSlug ?? null,
    linkedin_post_urn: post.id,
    linkedin_post_url: linkedinPostUrl(post.id),
    published_at: post.createdAt,
    deleted_at: post.deleted ? (post.deletedAt ?? post.createdAt) : null,
    publication_error: null,
  };
}

/** Backfill legacy local history and attach replacement relationships in two passes. */
export async function syncLocalHistory(posts, dependencies) {
  const idMap = new Map();
  for (const post of posts) {
    const record = await upsertPublishedPost(
      localPostLedgerPayload(post),
      dependencies,
    );
    post.databaseId = record.id;
    idMap.set(post.id, record.id);
  }
  for (const post of posts) {
    if (!post.editedFrom) continue;
    const replacesId = idMap.get(post.editedFrom);
    if (replacesId)
      await updateLedgerPost(
        post.databaseId,
        { replaces_id: replacesId },
        dependencies,
      );
  }
  return posts;
}
