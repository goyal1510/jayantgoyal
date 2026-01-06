export type ProjectId = "jayantgoyal" | "sujago" | "charge-capture-healthcare";

export interface ProjectConfig {
  id: ProjectId;
  name: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
}

export const PROJECTS: Record<ProjectId, ProjectConfig> = {
  jayantgoyal: {
    id: "jayantgoyal",
    name: "Jayant Goyal",
    supabaseUrl: process.env.NEXT_PUBLIC_JAYANTGOYAL_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_JAYANTGOYAL_SUPABASE_ANON_KEY || "",
    supabaseServiceRoleKey: process.env.JAYANTGOYAL_SUPABASE_SERVICE_ROLE_KEY || "",
  },
  sujago: {
    id: "sujago",
    name: "Sujago",
    supabaseUrl: process.env.NEXT_PUBLIC_SUJAGO_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUJAGO_SUPABASE_ANON_KEY || "",
    supabaseServiceRoleKey: process.env.SUJAGO_SUPABASE_SERVICE_ROLE_KEY || "",
  },
  "charge-capture-healthcare": {
    id: "charge-capture-healthcare",
    name: "Charge Capture Healthcare",
    supabaseUrl: process.env.NEXT_PUBLIC_CHARGE_CAPTURE_HEALTHCARE_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_CHARGE_CAPTURE_HEALTHCARE_SUPABASE_ANON_KEY || "",
    supabaseServiceRoleKey: process.env.CHARGE_CAPTURE_HEALTHCARE_SUPABASE_SERVICE_ROLE_KEY || "",
  },
};

export const PROJECT_LIST: ProjectConfig[] = Object.values(PROJECTS);

