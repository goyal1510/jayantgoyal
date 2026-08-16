import { createGitHubClient } from "./client";
import type { GitHubClient, GitHubClientOptions } from "./types";

export function createGitHubServerClient(
  options: Omit<GitHubClientOptions, "baseUrl" | "token"> = {},
): GitHubClient {
  return createGitHubClient({
    ...options,
    baseUrl: "https://api.github.com",
    token: process.env.GITHUB_TOKEN,
  });
}

export const githubServerClient = createGitHubServerClient();
