#!/usr/bin/env node

import {
  createLedgerPost,
  listLedgerPosts,
  publishedLedgerPatch,
  syncLocalHistory,
  updateLedgerPost,
} from "./lib/ledger.mjs";
import {
  linkedinPostUrl,
  loadLinkedInToken,
  loadPosts,
  savePosts,
} from "./lib/history.mjs";
import { deleteFromLinkedIn, publishToLinkedIn } from "./lib/linkedin-api.mjs";

export function parseContentOptions(args) {
  const parsed = {
    content: "",
    articleUrl: undefined,
    writingSlug: "",
    topic: null,
    scheduledFor: null,
  };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--url" && args[index + 1]) {
      parsed.articleUrl = args[++index];
    } else if (value === "--writing" && args[index + 1]) {
      parsed.writingSlug = args[++index];
    } else if (value === "--topic" && args[index + 1]) {
      parsed.topic = args[++index];
    } else if (value === "--schedule" && args[index + 1]) {
      parsed.scheduledFor = args[++index];
    } else if (!value.startsWith("--")) {
      parsed.content = value;
    }
  }
  if (parsed.writingSlug && parsed.articleUrl === undefined) {
    parsed.articleUrl = `https://jayantgoyal.com/writing/${parsed.writingSlug}`;
  }
  return parsed;
}

function requirePost(posts, rawIndex) {
  const index = Number.parseInt(rawIndex, 10);
  if (!Number.isInteger(index) || index < 0 || index >= posts.length) {
    throw new Error(`Invalid index ${rawIndex}. Run manage.mjs list first.`);
  }
  return { index, post: posts[index] };
}

function listLocalPosts() {
  const posts = loadPosts();
  if (!posts.length) {
    console.log("No locally tracked published posts.");
    return;
  }
  for (const [index, post] of posts.entries()) {
    const status = post.deleted
      ? post.editedTo
        ? "replaced"
        : "deleted"
      : "published";
    const preview = post.text.replace(/\s+/g, " ").slice(0, 90);
    console.log(`[${index}] ${status} · ${post.createdAt}\n    ${preview}`);
  }
}

async function listQueue() {
  const records = await listLedgerPosts({ queueOnly: true });
  if (!records.length) {
    console.log("No planned, scheduled, or failed posts.");
    return;
  }
  for (const record of records) {
    const timing = record.scheduled_for ? ` · ${record.scheduled_for}` : "";
    const preview = record.content.replace(/\s+/g, " ").slice(0, 100);
    console.log(`${record.id} · ${record.status}${timing}\n    ${preview}`);
  }
}

async function planPost(args) {
  const input = parseContentOptions(args);
  if (!input.content) {
    throw new Error('Usage: manage.mjs plan "Post text" [options]');
  }
  if (input.scheduledFor && Number.isNaN(Date.parse(input.scheduledFor))) {
    throw new Error("--schedule must be a valid ISO date and time.");
  }
  const record = await createLedgerPost({
    status: input.scheduledFor ? "scheduled" : "planned",
    content: input.content,
    articleUrl: input.articleUrl ?? null,
    writingSlug: input.writingSlug || null,
    scheduledFor: input.scheduledFor
      ? new Date(input.scheduledFor).toISOString()
      : null,
    topic: input.topic,
  });
  console.log(`Saved ${record.status} post ${record.id}.`);
  console.log(
    `Publish later with: node scripts/linkedin/post.mjs --record ${record.id}`,
  );
}

async function syncHistory() {
  const posts = loadPosts();
  await syncLocalHistory(posts);
  savePosts(posts);
  console.log(
    `Synchronized ${posts.length} local published records with Supabase.`,
  );
  return posts;
}

async function deletePost(rawIndex) {
  const token = loadLinkedInToken();
  const posts = await syncHistory();
  const { index, post } = requirePost(posts, rawIndex);
  if (post.deleted) {
    console.log("Post is already deleted.");
    return;
  }
  await deleteFromLinkedIn({
    accessToken: token.access_token,
    postUrn: post.id,
  });
  const deletedAt = new Date().toISOString();
  posts[index] = { ...post, deleted: true, deletedAt };
  savePosts(posts);
  await updateLedgerPost(post.databaseId, {
    status: "deleted",
    deleted_at: deletedAt,
  });
  console.log(`Deleted ${post.id} and retained its ledger record.`);
}

async function editPost(rawIndex, args) {
  const token = loadLinkedInToken();
  const posts = await syncHistory();
  const { index, post: oldPost } = requirePost(posts, rawIndex);
  if (oldPost.deleted) throw new Error("Cannot replace a deleted post.");
  const input = parseContentOptions(args);
  const content = input.content || oldPost.text;
  const articleUrl =
    input.articleUrl === undefined ? oldPost.url : input.articleUrl;
  console.log(
    "This deletes the old post and loses its reactions and comments.",
  );
  console.log("Proceeding in 3 seconds; press Ctrl+C to cancel.");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await deleteFromLinkedIn({
    accessToken: token.access_token,
    postUrn: oldPost.id,
  });
  const deletedAt = new Date().toISOString();
  posts[index] = { ...oldPost, deleted: true, deletedAt };
  savePosts(posts);
  await updateLedgerPost(oldPost.databaseId, {
    status: "deleted",
    deleted_at: deletedAt,
  });

  const writingSlug =
    input.writingSlug || oldPost.writingSlug || oldPost.blogSlug || null;
  const replacement = await createLedgerPost({
    status: "publishing",
    content,
    articleUrl: articleUrl ?? null,
    writingSlug,
    replacesId: oldPost.databaseId,
  });
  let newUrn;
  try {
    newUrn = await publishToLinkedIn({
      accessToken: token.access_token,
      personId: token.person_id,
      content,
      articleUrl,
    });
  } catch (error) {
    await updateLedgerPost(replacement.id, {
      status: "failed",
      publication_error: error.message.slice(0, 2000),
    });
    throw error;
  }
  const publishedAt = new Date().toISOString();
  posts[index].editedTo = newUrn;
  posts.push({
    id: newUrn,
    text: content,
    url: articleUrl ?? null,
    writingSlug,
    createdAt: publishedAt,
    editedFrom: oldPost.id,
    databaseId: replacement.id,
  });
  savePosts(posts);
  await updateLedgerPost(
    replacement.id,
    publishedLedgerPatch(newUrn, publishedAt),
  );
  await updateLedgerPost(oldPost.databaseId, {
    status: "replaced",
    deleted_at: deletedAt,
  });
  console.log(`Replacement published and recorded: ${linkedinPostUrl(newUrn)}`);
}

async function main() {
  const [command = "list", ...args] = process.argv.slice(2);
  if (command === "list") return listLocalPosts();
  if (command === "queue") return listQueue();
  if (command === "plan") return planPost(args);
  if (command === "sync") return syncHistory();
  if (command === "delete") return deletePost(args[0]);
  if (command === "edit") return editPost(args[0], args.slice(1));
  throw new Error(
    "Commands: list, queue, plan, sync, delete <index>, edit <index> [text]",
  );
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
