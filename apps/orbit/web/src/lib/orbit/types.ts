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
};

export type CommentSummary = {
  id: string;
  cardId: string;
  authorId: string;
  body: string;
  createdAt: string;
};
