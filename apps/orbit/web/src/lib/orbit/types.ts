export type WorkspaceSummary = {
  id: string;
  name: string;
  description: string | null;
  ownerUserId: string;
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
