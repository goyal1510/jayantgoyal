#!/usr/bin/env node
/**
 * LinkedIn OAuth2 Authentication Flow
 * Run once to get an access token, then use post.mjs to share content.
 *
 * Usage: node scripts/linkedin/auth.mjs
 */

import http from "node:http";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = path.join(__dirname, ".token.json");

const CLIENT_ID = "86stm9tj5tkq7o";
const CLIENT_SECRET = "WPL_AP1.IcOJ674ATliAKEtY.rmxffw==";
const REDIRECT_URI = "http://localhost:3333/callback";
const SCOPES = "openid profile w_member_social";

// Step 1: Open browser for authorization
const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;

console.log("\n🔗 Opening LinkedIn authorization page...\n");
console.log(`If it doesn't open, visit:\n${authUrl}\n`);

try {
  execSync(`open "${authUrl}"`);
} catch {
  // Fallback for non-macOS
}

// Step 2: Local server to catch the callback
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:3333`);

  if (url.pathname !== "/callback") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    console.error(`\n❌ Authorization failed: ${error}`);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<h1>Authorization failed</h1><p>${error}</p>`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400);
    res.end("Missing code");
    return;
  }

  console.log("✓ Authorization code received. Exchanging for access token...");

  // Step 3: Exchange code for access token
  try {
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(`${tokenData.error}: ${tokenData.error_description}`);
    }

    // Step 4: Get user profile to get the person URN
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    const tokenInfo = {
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      person_id: profile.sub,
      name: profile.name,
    };

    // Save token
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenInfo, null, 2));
    console.log(`\n✓ Authenticated as: ${profile.name}`);
    console.log(`✓ Token saved to: ${TOKEN_FILE}`);
    console.log(`✓ Expires: ${tokenInfo.expires_at}`);
    console.log(`\nYou can now use: node scripts/linkedin/post.mjs "Your post text"`);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <h1>✓ LinkedIn Authorization Complete</h1>
      <p>Authenticated as <strong>${profile.name}</strong></p>
      <p>You can close this tab and return to the terminal.</p>
    `);
  } catch (err) {
    console.error(`\n❌ Token exchange failed: ${err.message}`);
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end(`<h1>Token exchange failed</h1><p>${err.message}</p>`);
  }

  server.close();
});

server.listen(3333, () => {
  console.log("Waiting for LinkedIn callback on http://localhost:3333...");
});
