import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PROJECTS, type ProjectId } from "@/lib/projects";

const PROJECT_COOKIE_KEY = "supabase-manager-selected-project";

async function getSelectedProjectId(): Promise<ProjectId> {
  const cookieStore = await cookies();
  const projectId = cookieStore.get(PROJECT_COOKIE_KEY)?.value;
  
  if (projectId && projectId in PROJECTS) {
    return projectId as ProjectId;
  }
  
  // Default to first project
  return "jayantgoyal";
}

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const projectId = await getSelectedProjectId();
  const project = PROJECTS[projectId];

  if (!project.supabaseUrl || !project.supabaseAnonKey) {
    throw new Error(
      `Missing Supabase configuration for project: ${project.name}`
    );
  }

  return createClient(project.supabaseUrl, project.supabaseAnonKey);
}

export async function createSupabaseServerAdminClient(): Promise<SupabaseClient> {
  const projectId = await getSelectedProjectId();
  const project = PROJECTS[projectId];

  if (!project.supabaseUrl || !project.supabaseServiceRoleKey) {
    throw new Error(
      `Missing Supabase service role configuration for project: ${project.name}`
    );
  }

  return createClient(project.supabaseUrl, project.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Legacy function for explicit project ID (if needed)
export function createSupabaseServiceRoleClient(
  projectId: ProjectId
): SupabaseClient {
  const project = PROJECTS[projectId];

  if (!project.supabaseUrl || !project.supabaseServiceRoleKey) {
    throw new Error(
      `Missing Supabase service role configuration for project: ${project.name}`
    );
  }

  return createClient(project.supabaseUrl, project.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
