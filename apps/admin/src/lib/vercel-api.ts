import type {
  VercelDeployment,
  VercelDeploymentDetail,
  VercelBuildLogEntry,
  VercelEnvVar,
  VercelProjectKey,
} from "@/lib/types";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Deployments

export async function listDeployments(
  project: VercelProjectKey,
  limit = 20
): Promise<VercelDeployment[]> {
  const data = await apiFetch<{ deployments: VercelDeployment[] }>(
    `/api/vercel/deployments?project=${project}&limit=${limit}`
  );
  return data.deployments;
}

export async function getDeployment(
  id: string
): Promise<VercelDeploymentDetail> {
  return apiFetch<VercelDeploymentDetail>(`/api/vercel/deployments/${id}`);
}

export async function getBuildLogs(
  id: string
): Promise<VercelBuildLogEntry[]> {
  return apiFetch<VercelBuildLogEntry[]>(
    `/api/vercel/deployments/${id}/events`
  );
}

export async function redeployDeployment(
  deploymentId: string,
  project: VercelProjectKey,
  target: string
): Promise<VercelDeployment> {
  return apiFetch<VercelDeployment>("/api/vercel/deployments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "redeploy", deploymentId, project, target }),
  });
}

export async function rollbackDeployment(
  deploymentId: string,
  project: VercelProjectKey
): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/api/vercel/deployments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "rollback", deploymentId, project }),
  });
}

// Environment Variables

export async function listEnvVars(
  project: VercelProjectKey
): Promise<VercelEnvVar[]> {
  const data = await apiFetch<{ envs: VercelEnvVar[] }>(
    `/api/vercel/env?project=${project}`
  );
  return data.envs;
}

export async function createEnvVar(
  project: VercelProjectKey,
  envVar: { key: string; value: string; type: string; target: string[] }
): Promise<VercelEnvVar> {
  return apiFetch<VercelEnvVar>("/api/vercel/env", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, ...envVar }),
  });
}

export async function updateEnvVar(
  id: string,
  project: VercelProjectKey,
  data: { value: string; target?: string[] }
): Promise<VercelEnvVar> {
  return apiFetch<VercelEnvVar>(`/api/vercel/env/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, ...data }),
  });
}

export async function deleteEnvVar(
  id: string,
  project: VercelProjectKey
): Promise<void> {
  await apiFetch<Record<string, never>>(`/api/vercel/env/${id}?project=${project}`, {
    method: "DELETE",
  });
}
