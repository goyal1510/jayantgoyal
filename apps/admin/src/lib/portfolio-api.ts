import type {
  PortfolioCreateInput,
  PortfolioRecordMap,
  PortfolioSectionPresentationInput,
  PortfolioSectionPresentationResponse,
  PortfolioTable,
  PortfolioUpdateInput,
} from "@repo/portfolio-data";

export interface PortfolioApiResponse<T> {
  data?: T;
  error?: string;
  fields?: string[];
  success?: boolean;
}

export async function fetchPortfolioData<Table extends PortfolioTable>(
  table: Table,
  id?: string,
): Promise<PortfolioApiResponse<PortfolioRecordMap[Table]>> {
  const url = id
    ? `/api/portfolio/${table}?id=${id}`
    : `/api/portfolio/${table}`;

  const response = await fetch(url);
  return response.json();
}

export async function createPortfolioData<Table extends PortfolioTable>(
  table: Table,
  data: PortfolioCreateInput<Table>,
): Promise<PortfolioApiResponse<PortfolioRecordMap[Table]>> {
  const response = await fetch(`/api/portfolio/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updatePortfolioData<Table extends PortfolioTable>(
  table: Table,
  id: string,
  data: PortfolioUpdateInput<Table>,
): Promise<PortfolioApiResponse<PortfolioRecordMap[Table]>> {
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
): Promise<PortfolioApiResponse<void>> {
  const response = await fetch(`/api/portfolio/${table}?id=${id}`, {
    method: "DELETE",
  });
  return response.json();
}

export async function savePortfolioSectionPresentation(
  input: PortfolioSectionPresentationInput,
): Promise<PortfolioApiResponse<PortfolioSectionPresentationResponse>> {
  const response = await fetch("/api/portfolio/section-presentation", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return response.json();
}
