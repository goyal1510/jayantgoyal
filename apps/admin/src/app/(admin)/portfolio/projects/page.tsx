import type { Metadata } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProjectsList } from "./projects-list";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: projects } = await supabase
    .schema("portfolio")
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true });

  return <ProjectsList initialData={projects ?? []} />;
}
