type PortfolioTable =
  | "hero"
  | "about"
  | "education"
  | "experience"
  | "skill_categories"
  | "skills"
  | "projects"
  | "certificates"
  | "contact"
  | "nav_items"
  | "section_content";

interface ApiResponse<T> {
  data?: T;
  error?: string;
  success?: boolean;
}

export async function fetchPortfolioData<T>(
  table: PortfolioTable,
  id?: string,
): Promise<ApiResponse<T>> {
  const url = id
    ? `/api/portfolio/${table}?id=${id}`
    : `/api/portfolio/${table}`;

  const response = await fetch(url);
  return response.json();
}

export async function createPortfolioData<T>(
  table: PortfolioTable,
  data: Partial<T>,
): Promise<ApiResponse<T>> {
  const response = await fetch(`/api/portfolio/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updatePortfolioData<T>(
  table: PortfolioTable,
  id: string,
  data: Partial<T>,
): Promise<ApiResponse<T>> {
  const response = await fetch(`/api/portfolio/${table}?id=${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deletePortfolioData(
  table: PortfolioTable,
  id: string,
): Promise<ApiResponse<void>> {
  const response = await fetch(`/api/portfolio/${table}?id=${id}`, {
    method: "DELETE",
  });
  return response.json();
}
