import http from "node:http";

const port = Number(process.env.AUTH_TEST_FAKE_SUPABASE_PORT || 54329);
const localUserId = "00000000-0000-4000-8000-000000000001";
const localAccessToken = [
  Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
    "base64url",
  ),
  Buffer.from(
    JSON.stringify({
      sub: localUserId,
      aud: "authenticated",
      role: "authenticated",
      aal: "aal1",
    }),
  ).toString("base64url"),
  "local-signature",
].join(".");
const localRefreshToken = "local-oauth-refresh-token";

const user = {
  id: localUserId,
  aud: "authenticated",
  role: "authenticated",
  email: "sso-test@example.com",
  email_confirmed_at: "2026-01-01T00:00:00.000Z",
  app_metadata: { provider: "google", providers: ["google"] },
  user_metadata: { full_name: "Local OAuth Test" },
  identities: [],
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

function writeJson(response, status, body) {
  response.writeHead(status, {
    "access-control-allow-origin": "*",
    "access-control-allow-headers":
      "apikey, authorization, content-type, x-client-info, x-supabase-api-version",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "cache-control": "private, no-store",
    "content-type": "application/json",
  });
  response.end(JSON.stringify(body));
}

function writeEmpty(response, status = 204) {
  response.writeHead(status, {
    "access-control-allow-origin": "*",
    "access-control-allow-headers":
      "apikey, authorization, content-type, x-client-info, x-supabase-api-version",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "cache-control": "private, no-store",
  });
  response.end();
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(Object.fromEntries(new URLSearchParams(raw)));
      }
    });
    request.on("error", reject);
  });
}

function sessionResponse() {
  return {
    access_token: localAccessToken,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: localRefreshToken,
    user,
  };
}

function invalidCode(code) {
  return (
    typeof code !== "string" ||
    !code ||
    code === "not-a-real-pkce-code" ||
    code === "expired-code"
  );
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-headers":
        "apikey, authorization, content-type, x-client-info, x-supabase-api-version",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    });
    return response.end();
  }

  if (url.pathname === "/health") {
    return writeJson(response, 200, { status: "ok" });
  }

  if (url.pathname === "/auth/v1/settings" && request.method === "GET") {
    return writeJson(response, 200, {
      external: {
        apple: false,
        azure: false,
        bitbucket: false,
        discord: false,
        facebook: false,
        figma: false,
        fly: false,
        github: false,
        gitlab: false,
        google: false,
        kakao: false,
        keycloak: false,
        linkedin: false,
        linkedin_oidc: false,
        notion: false,
        spotify: false,
        slack: false,
        workos: false,
        twitch: false,
        twitter: false,
        email: true,
        phone: false,
        zoom: false,
      },
      disable_signup: false,
      mailer_autoconfirm: true,
      password: { min_length: 6, hiblp: false },
    });
  }

  // This loopback-only authorize endpoint stands in for Google's consent page.
  // It returns a synthetic code so the real application callback can be tested.
  if (url.pathname === "/auth/v1/authorize" && request.method === "GET") {
    const redirectTo =
      url.searchParams.get("redirect_to") ||
      url.searchParams.get("redirect_uri");
    if (!redirectTo)
      return writeJson(response, 400, { error: "missing redirect" });

    const callbackUrl = new URL(redirectTo);
    callbackUrl.searchParams.set("code", "local-google-code");
    const state = url.searchParams.get("state");
    if (state) callbackUrl.searchParams.set("state", state);
    response.writeHead(302, { location: callbackUrl.toString() });
    return response.end();
  }

  if (url.pathname === "/auth/v1/token" && request.method === "POST") {
    const body = await readBody(request);
    const grantType = url.searchParams.get("grant_type");
    if (grantType === "pkce") {
      if (invalidCode(body.auth_code)) {
        return writeJson(response, 400, {
          error: "invalid_grant",
          error_description: "The local OAuth code is invalid.",
        });
      }
      return writeJson(response, 200, sessionResponse());
    }

    if (grantType === "password") {
      if (
        body.email !== "sso-test@example.com" ||
        body.password !== "local-test-password"
      ) {
        return writeJson(response, 400, {
          error: "invalid_grant",
          error_description: "The local password is invalid.",
        });
      }
      return writeJson(response, 200, sessionResponse());
    }

    if (grantType === "refresh_token") {
      if (body.refresh_token !== localRefreshToken) {
        return writeJson(response, 400, {
          error: "invalid_grant",
          error_description: "The local refresh token is invalid.",
        });
      }
      return writeJson(response, 200, sessionResponse());
    }

    return writeJson(response, 400, { error: "unsupported_grant_type" });
  }

  if (url.pathname === "/auth/v1/user" && request.method === "GET") {
    if (request.headers.authorization === `Bearer ${localAccessToken}`) {
      return writeJson(response, 200, user);
    }
    return writeJson(response, 401, {
      error: "invalid_token",
      error_description: "The local access token is invalid.",
    });
  }

  if (url.pathname === "/auth/v1/logout") {
    return writeEmpty(response);
  }

  if (
    url.pathname.startsWith("/auth/v1/admin/users/") &&
    url.pathname.endsWith("/factors")
  ) {
    return writeJson(response, 200, { factors: [] });
  }

  if (url.pathname.startsWith("/rest/v1/")) {
    return writeJson(response, 200, []);
  }

  return writeJson(response, 404, { error: "not_found" });
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`fake Supabase auth listening on 127.0.0.1:${port}\n`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
