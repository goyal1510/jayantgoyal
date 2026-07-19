import { describe, expect, it, vi } from "vitest";

import { createGitHubClient } from "./client";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function user(login = "goyal1510") {
  return {
    login,
    name: "Jayant Goyal",
    avatar_url: "https://example.com/avatar.png",
    html_url: `https://github.com/${login}`,
    bio: null,
    location: null,
    company: null,
    blog: null,
    twitter_username: null,
    public_repos: 1,
    public_gists: 0,
    followers: 0,
    following: 0,
    created_at: "2022-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function repo(name: string, overrides: Record<string, unknown> = {}) {
  return {
    id: name.length,
    name,
    full_name: `goyal1510/${name}`,
    html_url: `https://github.com/goyal1510/${name}`,
    description: null,
    language: "TypeScript",
    stargazers_count: 0,
    forks_count: 0,
    watchers_count: 0,
    open_issues_count: 0,
    fork: false,
    archived: false,
    created_at: "2022-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    pushed_at: "2026-01-01T00:00:00.000Z",
    topics: [],
    size: 1,
    ...overrides,
  };
}

describe("shared GitHub client", () => {
  it("paginates repositories, caches case-insensitively, and sends bearer tokens", async () => {
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      const url = new URL(String(input));
      expect(init?.headers).toBeInstanceOf(Headers);
      expect((init?.headers as Headers).get("Authorization")).toBe("Bearer test-token");
      if (url.pathname === "/users/goyal1510") return jsonResponse(user());
      if (url.pathname.endsWith("/repos")) {
        return jsonResponse(
          url.searchParams.get("page") === "1"
            ? Array.from({ length: 100 }, (_, index) => repo(`repo-${index}`))
            : [repo("last-repo")],
        );
      }
      return jsonResponse({});
    });
    const client = createGitHubClient({ fetcher, token: "test-token" });

    expect((await client.fetchRepositories("Goyal1510")).length).toBe(101);
    expect((await client.fetchRepositories("goyal1510")).length).toBe(101);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("surfaces not-found and rate-limit contracts", async () => {
    const notFound = createGitHubClient({
      fetcher: vi.fn<typeof fetch>(async () => jsonResponse({ message: "Not Found" }, 404)),
    });
    await expect(notFound.fetchUser("missing")).rejects.toMatchObject({
      status: 404,
      code: "not_found",
    });

    const limited = createGitHubClient({
      fetcher: vi.fn<typeof fetch>(async () => jsonResponse({ message: "API rate limit exceeded" }, 403)),
    });
    await expect(limited.fetchUser("goyal1510")).rejects.toMatchObject({
      status: 403,
      code: "rate_limited",
    });
  });
});
