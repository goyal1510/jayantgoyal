"use client";

import * as React from "react";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useProject } from "@/contexts/project-context";

export function useSupabaseClient(): SupabaseClient {
  const { selectedProject } = useProject();

  return React.useMemo(() => {
    if (!selectedProject.supabaseUrl || !selectedProject.supabaseAnonKey) {
      throw new Error(
        `Missing Supabase configuration for project: ${selectedProject.name}`
      );
    }

    return createClient(
      selectedProject.supabaseUrl,
      selectedProject.supabaseAnonKey
    );
  }, [selectedProject]);
}
