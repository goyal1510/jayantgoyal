import type {
  PortfolioBlogPostRecord,
  PortfolioBlogUpdateInput,
  PortfolioBlogWriteInput,
} from "@repo/portfolio-data";

type BlogTable = "blog_posts";

export interface BlogApiResponse<T> {
  data?: T;
  error?: string;
  success?: boolean;
}

export async function fetchBlogData(
  table: BlogTable,
  id?: string
): Promise<BlogApiResponse<PortfolioBlogPostRecord | PortfolioBlogPostRecord[]>> {
  const url = id
    ? `/api/jg-app/${table}?id=${id}`
    : `/api/jg-app/${table}`;

  const response = await fetch(url);
  return response.json();
}

export async function createBlogData(
  table: BlogTable,
  data: PortfolioBlogWriteInput,
): Promise<BlogApiResponse<PortfolioBlogPostRecord>> {
  const response = await fetch(`/api/jg-app/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateBlogData(
  table: BlogTable,
  id: string,
  data: PortfolioBlogUpdateInput,
): Promise<BlogApiResponse<PortfolioBlogPostRecord>> {
  const response = await fetch(`/api/jg-app/${table}?id=${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteBlogData(
  table: BlogTable,
  id: string
): Promise<BlogApiResponse<void>> {
  const response = await fetch(`/api/jg-app/${table}?id=${id}`, {
    method: "DELETE",
  });
  return response.json();
}
