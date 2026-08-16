import type { WorkItem } from "@/lib/types";

export type WorkFormData = Omit<WorkItem, "id" | "created_at" | "updated_at">;

/** Defines the complete initial value for the work editor's controlled form. */
export const emptyWorkForm: WorkFormData = {
  name: "",
  slug: "",
  eyebrow: "",
  short_description: "",
  impact: "",
  contribution: "",
  year_label: "",
  image_url: "",
  image_alt: "",
  case_study: null,
  case_study_published: false,
  tags: [],
  github_link: "",
  live_link: "",
  sort_order: 0,
  is_visible: true,
};
