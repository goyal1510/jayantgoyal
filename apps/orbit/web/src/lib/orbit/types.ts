export type WorkspaceSummary = {
  id: string;
  name: string;
  description: string | null;
  ownerUserId: string;
  lifecycle?: string;
};

export type BoardTemplateSummary = {
  id: string;
  name: string;
  description: string | null;
};

export type BoardSummary = {
  id: string;
  workspaceId: string;
  key: string;
  name: string;
  visibility: "workspace" | "private";
};

export type ColumnSummary = {
  id: string;
  boardId: string;
  name: string;
  category: string;
  rank: string;
};

export type CardSummary = {
  id: string;
  boardId: string;
  columnId: string;
  number: number;
  title: string;
  description: string | null;
  priority: string;
  rank: string;
  version: number;
  dueDate: string | null;
  archivedAt?: string | null;
};

export type CommentSummary = {
  id: string;
  cardId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type LabelSummary = {
  id: string;
  workspaceId: string;
  name: string;
  colorToken: string;
};

export type MemberSummary = {
  userId: string;
  role: string;
  displayName: string;
  status?: string;
};

export type ChecklistSummary = {
  id: string;
  cardId: string;
  title: string;
  items: Array<{ id: string; body: string; completed: boolean }>;
};

export type DependencySummary = {
  id: string;
  dependsOnCardId: string;
  dependencyType: string;
  dependsOnTitle: string;
  dependsOnNumber: number;
};

export type SavedViewSummary = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  isShared: boolean;
  isOwner: boolean;
};

export type AutomationRuleSummary = {
  id: string;
  name: string;
  enabled: boolean;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
};

export type GithubLinkSummary = {
  id: string;
  issueUrl: string;
  issueTitle: string | null;
  repoFullName: string;
  issueNumber: number;
};

export type PublishedBoardSummary = {
  slug: string;
  publishedAt: string;
};

export type AttachmentSummary = {
  id: string;
  cardId: string;
  originalName: string;
  mime: string;
  bytes: number;
  objectKey: string;
};

export type NotificationSummary = {
  id: string;
  reason: string;
  subjectType: string;
  createdAt: string;
  readAt: string | null;
};
