#!/usr/bin/env node
/**
 * Post to LinkedIn from the terminal.
 *
 * Usage:
 *   node scripts/linkedin/post.mjs "Your post text here"
 *   node scripts/linkedin/post.mjs "Check out my writing!" --url https://www.jayantgoyal.com/writing/my-post
 *   node scripts/linkedin/post.mjs --writing introducing-jayantgoyal-com
 *
 * Options:
 *   --url <url>      Attach a link to the post
 *   --writing <slug> Auto-generate a post from a writing slug
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = path.join(__dirname, ".token.json");
const POSTS_FILE = path.join(__dirname, ".posts.json");

function loadToken() {
  if (!fs.existsSync(TOKEN_FILE)) {
    console.error("❌ No token found. Run: node scripts/linkedin/auth.mjs");
    process.exit(1);
  }
  const token = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
  if (new Date(token.expires_at) < new Date()) {
    console.error("❌ Token expired. Run: node scripts/linkedin/auth.mjs");
    process.exit(1);
  }
  return token;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let text = "";
  let url = "";
  let writingSlug = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--url" && args[i + 1]) {
      url = args[++i];
    } else if (args[i] === "--writing" && args[i + 1]) {
      writingSlug = args[++i];
    } else if (!args[i].startsWith("--")) {
      text = args[i];
    }
  }

  return { text, url, writingSlug };
}

async function postToLinkedIn(accessToken, personId, text, articleUrl) {
  const body = {
    author: `urn:li:person:${personId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: articleUrl ? "ARTICLE" : "NONE",
        ...(articleUrl && {
          media: [
            {
              status: "READY",
              originalUrl: articleUrl,
            },
          ],
        }),
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`LinkedIn API error (${res.status}): ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.id;
}

function loadPosts() {
  if (!fs.existsSync(POSTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8"));
}

function savePost(entry) {
  const posts = loadPosts();
  posts.push(entry);
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

async function main() {
  const token = loadToken();
  let { text, url, writingSlug } = parseArgs();

  // Auto-generate post from writing slug
  if (writingSlug) {
    url = `https://www.jayantgoyal.com/writing/${writingSlug}`;
    if (!text) {
      text = `📝 New writing!\n\nRead it here 👇\n${url}\n\n#webdev #developer #nextjs #coding`;
    }
  }

  if (!text) {
    console.error("Usage:");
    console.error('  node scripts/linkedin/post.mjs "Your post text"');
    console.error('  node scripts/linkedin/post.mjs "Text" --url https://example.com');
    console.error("  node scripts/linkedin/post.mjs --writing my-post-slug");
    process.exit(1);
  }

  console.log("\n📤 Posting to LinkedIn...");
  console.log(`\n--- Preview ---\n${text}\n${url ? `🔗 ${url}\n` : ""}--- End ---\n`);

  try {
    const postId = await postToLinkedIn(token.access_token, token.person_id, text, url);
    console.log(`✓ Posted successfully!`);
    console.log(`  Post ID: ${postId}`);
    console.log(`  View: https://www.linkedin.com/feed/`);

    // Save to post history
    savePost({ id: postId, text, url: url || null, writingSlug: writingSlug || null, createdAt: new Date().toISOString() });
    console.log(`  Logged to history (${POSTS_FILE})`);
  } catch (err) {
    console.error(`❌ Failed to post: ${err.message}`);
    process.exit(1);
  }
}

main();
