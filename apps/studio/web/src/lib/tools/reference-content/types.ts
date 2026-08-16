type ToolFaq = {
  question: string;
  answer: string;
};

type ToolSeoContent = {
  summary: string;
  useCases: string[];
  examples: string[];
  considerations: string;
  faqs?: ToolFaq[];
};

export type ToolReferenceDetails = {
  summary: string;
  useCases: readonly [string, string, ...string[]];
  examples: readonly [string, string, ...string[]];
  considerations: string;
  faqs?: readonly [ToolFaq, ToolFaq, ...ToolFaq[]];
};

export type ToolReferenceRegistry = Record<string, ToolSeoContent>;
