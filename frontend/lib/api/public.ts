import type {
  Category,
  PageResponse,
  PortfolioDetail,
  PortfolioListItem,
  SiteInfo,
} from "./types";

export type AdjacentResponse = {
  previous: { id: number; title: string } | null;
  next: { id: number; title: string } | null;
};

/** SSR/CSR 분기는 client.ts와 동일. fetch 시점에 평가. */
function resolveApiBase(): string {
  if (typeof window === "undefined") {
    return process.env.API_BASE_INTERNAL || "http://127.0.0.1:8080";
  }
  return process.env.NEXT_PUBLIC_API_BASE || "";
}

async function getJson<T>(path: string): Promise<T | null> {
  const res = await fetch(`${resolveApiBase()}${path}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export const publicApi = {
  listPortfolios: (category: Category, page = 0, size = 12) =>
    getJson<PageResponse<PortfolioListItem>>(
      `/api/portfolios?category=${category}&page=${page}&size=${size}`
    ),

  getPortfolio: (id: number) => getJson<PortfolioDetail>(`/api/portfolios/${id}`),

  getAdjacent: (id: number, category: Category) =>
    getJson<AdjacentResponse>(`/api/portfolios/${id}/adjacent?category=${category}`),

  getSiteInfo: () => getJson<SiteInfo>(`/api/site-info`),
};
