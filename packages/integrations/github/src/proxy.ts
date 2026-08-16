import { createGitHubClient } from "./client";
import type { GitHubClient, GitHubClientOptions, GitHubRequestParams } from "./types";

export function isAllowedGitHubProxyPath(path: string): boolean {
  return path.startsWith("/users/") || path.startsWith("/repos/");
}

export function createGitHubProxyClient(
  options: Omit<GitHubClientOptions, "baseUrl" | "token" | "request"> & {
    endpoint?: string;
  } = {},
): GitHubClient {
  const endpoint = options.endpoint ?? "/api/github-stats";
  const fetcher = options.fetcher ?? fetch;

  return createGitHubClient({
    ...options,
    fetcher,
    request: async (path, params, init) => {
      const query = new URLSearchParams({
        path,
        ...(params satisfies GitHubRequestParams | undefined),
      });
      const separator = endpoint.includes("?") ? "&" : "?";
      return fetcher(`${endpoint}${separator}${query.toString()}`, init);
    },
  });
}
