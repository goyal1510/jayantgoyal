#!/usr/bin/env node
/**
 * Manage LinkedIn posts — list, edit (delete + re-post), or delete.
 *
 * Usage:
 *   node scripts/linkedin/manage.mjs list                  # Show all tracked posts
 *   node scripts/linkedin/manage.mjs delete <index>        # Delete post by index
 *   node scripts/linkedin/manage.mjs edit <index> "New text" [--url <url>]  # Edit (delete + re-post)
 *
 * Note: LinkedIn API does not support editing posts directly.
 *       "edit" will delete the old post and create a new one (engagement is lost).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = path.join(__dirname, ".token.json");
const POSTS_FILE = path.join(__dirname, ".posts.json");

function loadToken() {
  if (!fs.existsSync(TOKEN_FILE)) {
    console.error("No token found. Run: node scripts/linkedin/auth.mjs");
    process.exit(1);
  }
  const token = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
  if (new Date(token.expires_at) < new Date()) {
    console.error("Token expired. Run: node scripts/linkedin/auth.mjs");
    process.exit(1);
  }
  return token;
}

function loadPosts() {
  if (!fs.existsSync(POSTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8"));
}

function savePosts(posts) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

// ── List ──────────────────────────────────────────────

function listPosts() {
  const posts = loadPosts();
  if (posts.length === 0) {
    console.log("No posts tracked yet.");
    return;
  }

  console.log(`\n  LinkedIn Posts (${posts.length})\n`);
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const date = new Date(p.createdAt).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const preview = p.text.length > 80 ? p.text.slice(0, 77) + "..." : p.text;
    const status = p.deleted ? " [DELETED]" : "";
    console.log(`  [${i}]${status} ${date}`);
    console.log(`      ${preview}`);
    if (p.url) console.log(`      ${p.url}`);
    console.log();
  }
}

// ── Delete ────────────────────────────────────────────

async function deletePost(index) {
  const token = loadToken();
  const posts = loadPosts();

  if (index < 0 || index >= posts.length) {
    console.error(`Invalid index ${index}. Use "list" to see available posts.`);
    process.exit(1);
  }

  const post = posts[index];
  if (post.deleted) {
    console.log("Post already deleted.");
    return;
  }

  const encodedUrn = encodeURIComponent(post.id);
  const res = await fetch(`https://api.linkedin.com/v2/ugcPosts/${encodedUrn}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    console.error(`Failed to delete (${res.status}): ${err}`);
    process.exit(1);
  }

  posts[index].deleted = true;
  posts[index].deletedAt = new Date().toISOString();
  savePosts(posts);
  console.log(`Deleted post [${index}] from LinkedIn and marked in history.`);
}

// ── Edit (delete + re-post) ───────────────────────────

async function editPost(index, newText, newUrl) {
  const token = loadToken();
  const posts = loadPosts();

  if (index < 0 || index >= posts.length) {
    console.error(`Invalid index ${index}. Use "list" to see available posts.`);
    process.exit(1);
  }

  const old = posts[index];
  if (old.deleted) {
    console.error("Cannot edit a deleted post.");
    process.exit(1);
  }

  const text = newText || old.text;
  const url = newUrl !== undefined ? newUrl : old.url;

  console.log("\n--- Old post ---");
  console.log(old.text);
  if (old.url) console.log(`${old.url}`);
  console.log("\n--- New post ---");
  console.log(text);
  if (url) console.log(`${url}`);
  console.log("\nThis will DELETE the old post (losing likes/comments) and create a new one.");
  console.log("Proceeding in 3 seconds... (Ctrl+C to cancel)\n");

  await new Promise((r) => setTimeout(r, 3000));

  // Delete old
  const encodedUrn = encodeURIComponent(old.id);
  const delRes = await fetch(`https://api.linkedin.com/v2/ugcPosts/${encodedUrn}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  if (!delRes.ok && delRes.status !== 404) {
    const err = await delRes.text();
    console.error(`Failed to delete old post (${delRes.status}): ${err}`);
    process.exit(1);
  }
  console.log("Old post deleted.");

  // Create new
  const body = {
    author: `urn:li:person:${token.person_id}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: url ? "ARTICLE" : "NONE",
        ...(url && { media: [{ status: "READY", originalUrl: url }] }),
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!postRes.ok) {
    const err = await postRes.json();
    console.error(`Failed to re-post (${postRes.status}): ${JSON.stringify(err)}`);
    // Mark old as deleted since it's already gone
    posts[index].deleted = true;
    posts[index].deletedAt = new Date().toISOString();
    savePosts(posts);
    process.exit(1);
  }

  const data = await postRes.json();
  const newId = data.id;

  // Update history: mark old as edited, add new entry
  posts[index].deleted = true;
  posts[index].deletedAt = new Date().toISOString();
  posts[index].editedTo = newId;

  posts.push({
    id: newId,
    text,
    url: url || null,
    writingSlug: old.writingSlug || old.blogSlug || null,
    createdAt: new Date().toISOString(),
    editedFrom: old.id,
  });

  savePosts(posts);
  console.log(`New post created!`);
  console.log(`  Post ID: ${newId}`);
  console.log(`  View: https://www.linkedin.com/feed/`);
}

// ── CLI ───────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "list") {
    listPosts();
    return;
  }

  if (command === "delete") {
    const index = parseInt(args[1], 10);
    if (isNaN(index)) {
      console.error("Usage: manage.mjs delete <index>");
      process.exit(1);
    }
    await deletePost(index);
    return;
  }

  if (command === "edit") {
    const index = parseInt(args[1], 10);
    if (isNaN(index)) {
      console.error('Usage: manage.mjs edit <index> "New text" [--url <url>]');
      process.exit(1);
    }
    let newText = "";
    let newUrl;
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--url" && args[i + 1]) {
        newUrl = args[++i];
      } else if (!args[i].startsWith("--")) {
        newText = args[i];
      }
    }
    await editPost(index, newText, newUrl);
    return;
  }

  console.error(`Unknown command: ${command}`);
  console.error("Commands: list, delete <index>, edit <index> \"text\" [--url <url>]");
  process.exit(1);
}

main();
