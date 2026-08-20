#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import http from "node:http";

import { loadLocalEnvironment } from "./lib/config.mjs";
import { TOKEN_FILE } from "./lib/history.mjs";

loadLocalEnvironment();

const clientId = process.env.LINKEDIN_CLIENT_ID;
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
const redirectUri =
  process.env.LINKEDIN_REDIRECT_URI ?? "http://localhost:3333/callback";
const scopes = "openid profile w_member_social";

if (!clientId || !clientSecret) {
  console.error(
    "Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in scripts/linkedin/.env.",
  );
  process.exit(1);
}

const redirect = new URL(redirectUri);
if (
  redirect.protocol !== "http:" ||
  !["localhost", "127.0.0.1"].includes(redirect.hostname)
) {
  console.error("LINKEDIN_REDIRECT_URI must use an HTTP localhost callback.");
  process.exit(1);
}

const state = randomBytes(32).toString("hex");
const authorization = new URL(
  "https://www.linkedin.com/oauth/v2/authorization",
);
authorization.search = new URLSearchParams({
  response_type: "code",
  client_id: clientId,
  redirect_uri: redirectUri,
  scope: scopes,
  state,
}).toString();

console.log("Opening LinkedIn authorization...");
console.log(`If the browser does not open, visit:\n${authorization}\n`);
try {
  execFileSync("open", [authorization.toString()]);
} catch {
  // The printed URL is the portable fallback.
}

const server = http.createServer(async (request, response) => {
  const callback = new URL(request.url, redirect.origin);
  if (callback.pathname !== redirect.pathname) {
    response.writeHead(404).end("Not found");
    return;
  }
  const providerError = callback.searchParams.get("error");
  const code = callback.searchParams.get("code");
  const returnedState = callback.searchParams.get("state");
  if (providerError || !code || returnedState !== state) {
    console.error(
      "LinkedIn authorization failed or returned an invalid callback state.",
    );
    response.writeHead(400, { "Content-Type": "text/plain" });
    response.end("LinkedIn authorization failed. Return to the terminal.");
    server.close();
    process.exitCode = 1;
    return;
  }

  try {
    const tokenResponse = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      },
    );
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token) {
      throw new Error(
        `LinkedIn token exchange failed (${tokenResponse.status}).`,
      );
    }
    const profileResponse = await fetch(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${token.access_token}` },
      },
    );
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.sub) {
      throw new Error(
        `LinkedIn profile lookup failed (${profileResponse.status}).`,
      );
    }
    const tokenInfo = {
      access_token: token.access_token,
      expires_in: token.expires_in,
      expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(),
      person_id: profile.sub,
      name: profile.name,
    };
    fs.writeFileSync(TOKEN_FILE, `${JSON.stringify(tokenInfo, null, 2)}\n`, {
      mode: 0o600,
    });
    console.log(`Authenticated as ${profile.name}.`);
    console.log(`LinkedIn token expires at ${tokenInfo.expires_at}.`);
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end(
      "<h1>LinkedIn authorization complete</h1><p>You can close this tab.</p>",
    );
  } catch (error) {
    console.error(error.message);
    response.writeHead(500, { "Content-Type": "text/plain" });
    response.end("LinkedIn authorization failed. Return to the terminal.");
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

server.listen(Number(redirect.port || 80), redirect.hostname, () => {
  console.log(`Waiting for the LinkedIn callback at ${redirectUri}...`);
});
