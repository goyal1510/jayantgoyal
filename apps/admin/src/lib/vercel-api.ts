import type {
  VercelDeployment,
  VercelDeploymentDetail,
  VercelBuildLogEntry,
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
  limit = 20,
): Promise<VercelDeployment[]> {
  const data = await apiFetch<{ deployments: VercelDeployment[] }>(
    `/api/vercel/deployments?project=${project}&limit=${limit}`,
  );
  return data.deployments;
}

export async function getDeployment(
  id: string,
): Promise<VercelDeploymentDetail> {
  return apiFetch<VercelDeploymentDetail>(`/api/vercel/deployments/${id}`);
}

export async function getBuildLogs(id: string): Promise<VercelBuildLogEntry[]> {
  return apiFetch<VercelBuildLogEntry[]>(
    `/api/vercel/deployments/${id}/events`,
  );
}

export async function redeployDeployment(
  deploymentId: string,
  project: VercelProjectKey,
  target: string,
): Promise<VercelDeployment> {
  return apiFetch<VercelDeployment>("/api/vercel/deployments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "redeploy", deploymentId, project, target }),
  });
}

export async function rollbackDeployment(
  deploymentId: string,
  project: VercelProjectKey,
): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/api/vercel/deployments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "rollback", deploymentId, project }),
  });
}
