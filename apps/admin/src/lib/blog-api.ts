type BlogTable = "blog_posts";

interface ApiResponse<T> {
  data?: T;
  error?: string;
  success?: boolean;
}

export async function fetchBlogData<T>(
  table: BlogTable,
  id?: string
): Promise<ApiResponse<T>> {
  const url = id
    ? `/api/jg-app/${table}?id=${id}`
    : `/api/jg-app/${table}`;

  const response = await fetch(url);
  return response.json();
}

export async function createBlogData<T>(
  table: BlogTable,
  data: Partial<T>
): Promise<ApiResponse<T>> {
  const response = await fetch(`/api/jg-app/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateBlogData<T>(
  table: BlogTable,
  id: string,
  data: Partial<T>
): Promise<ApiResponse<T>> {
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
): Promise<ApiResponse<void>> {
  const response = await fetch(`/api/jg-app/${table}?id=${id}`, {
    method: "DELETE",
  });
  return response.json();
}
