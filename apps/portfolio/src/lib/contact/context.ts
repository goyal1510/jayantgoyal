type ContactSearchParams = {
  project?: string | string[];
  source?: string | string[];
};

type ContactWorkReference = {
  id: string;
  title: string;
};

export type ContactContext = {
  initialProject?: string;
  leadSource: string;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function resolveContactContext(
  searchParams: ContactSearchParams,
  work: ContactWorkReference[],
): ContactContext {
  const source = firstValue(searchParams.source);
  const projectId = firstValue(searchParams.project);

  if (source !== "work-case-study" || !projectId) {
    return { leadSource: "direct" };
  }

  const project = work.find((item) => item.id === projectId);
  if (!project) return { leadSource: "direct" };

  return {
    leadSource: "work_case_study",
    initialProject: `I’d like to discuss a product after reading the ${project.title} case study.`,
  };
}
