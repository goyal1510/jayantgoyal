import fs from "node:fs";
import path from "node:path";

import { LINKEDIN_DIRECTORY } from "./config.mjs";

const POSTS_FILE = path.join(LINKEDIN_DIRECTORY, ".posts.json");
export const TOKEN_FILE = path.join(LINKEDIN_DIRECTORY, ".token.json");

export function loadPosts() {
  if (!fs.existsSync(POSTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(POSTS_FILE, "utf8"));
}

export function savePosts(posts) {
  fs.writeFileSync(POSTS_FILE, `${JSON.stringify(posts, null, 2)}\n`, {
    mode: 0o600,
  });
}

export function appendPost(entry) {
  const posts = loadPosts();
  posts.push(entry);
  savePosts(posts);
}

export function loadLinkedInToken() {
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error(
      "No LinkedIn token found. Run: node scripts/linkedin/auth.mjs",
    );
  }
  const token = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
  if (new Date(token.expires_at) <= new Date()) {
    throw new Error(
      "LinkedIn token expired. Run: node scripts/linkedin/auth.mjs",
    );
  }
  return token;
}

export function linkedinPostUrl(postUrn) {
  return `https://www.linkedin.com/feed/update/${postUrn}/`;
}
