import type {
  PortfolioWritingPostRecord,
  PortfolioWritingUpdateInput,
  PortfolioWritingWriteInput,
} from "@repo/portfolio-data";

type WritingTable = "writing_posts";

export interface WritingApiResponse<T> {
  data?: T;
  error?: string;
  success?: boolean;
}

export async function fetchWritingData(
  table: WritingTable,
  id?: string
): Promise<WritingApiResponse<PortfolioWritingPostRecord | PortfolioWritingPostRecord[]>> {
  const url = id
    ? `/api/jg-app/${table}?id=${id}`
    : `/api/jg-app/${table}`;

  const response = await fetch(url);
  return response.json();
}

export async function createWritingData(
  table: WritingTable,
  data: PortfolioWritingWriteInput,
): Promise<WritingApiResponse<PortfolioWritingPostRecord>> {
  const response = await fetch(`/api/jg-app/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateWritingData(
  table: WritingTable,
  id: string,
  data: PortfolioWritingUpdateInput,
): Promise<WritingApiResponse<PortfolioWritingPostRecord>> {
  const response = await fetch(`/api/jg-app/${table}?id=${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteWritingData(
  table: WritingTable,
  id: string
): Promise<WritingApiResponse<void>> {
  const response = await fetch(`/api/jg-app/${table}?id=${id}`, {
    method: "DELETE",
  });
  return response.json();
}
