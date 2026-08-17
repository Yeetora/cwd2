import { api, API_BASE } from "./client";
import type {
  AdminInfo,
  Category,
  PageResponse,
  PortfolioCreateInput,
  PortfolioDetail,
  PortfolioImage,
  PortfolioListItem,
  PortfolioUpdateInput,
  SiteInfo,
  SiteInfoUpdateInput,
} from "./types";

export const adminApi = {
  // auth
  login: (username: string, password: string) =>
    api<AdminInfo>("/api/admin/auth/login", {
      method: "POST",
      body: { username, password },
    }),

  logout: () => api<void>("/api/admin/auth/logout", { method: "POST" }),

  me: () => api<AdminInfo>("/api/admin/auth/me"),

  // portfolio
  listPortfolios: (params: { category?: Category; page?: number; size?: number } = {}) => {
    const search = new URLSearchParams();
    if (params.category) search.set("category", params.category);
    if (params.page != null) search.set("page", String(params.page));
    if (params.size != null) search.set("size", String(params.size));
    const qs = search.toString();
    return api<PageResponse<PortfolioListItem>>(`/api/admin/portfolios${qs ? `?${qs}` : ""}`);
  },

  getPortfolio: (id: number) => api<PortfolioDetail>(`/api/admin/portfolios/${id}`),

  createPortfolio: (input: PortfolioCreateInput) =>
    api<PortfolioDetail>("/api/admin/portfolios", { method: "POST", body: input }),

  updatePortfolio: (id: number, input: PortfolioUpdateInput) =>
    api<PortfolioDetail>(`/api/admin/portfolios/${id}`, { method: "PUT", body: input }),

  deletePortfolio: (id: number) =>
    api<void>(`/api/admin/portfolios/${id}`, { method: "DELETE" }),

  // images
  uploadImages: (portfolioId: number, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    return api<PortfolioImage[]>(`/api/admin/portfolios/${portfolioId}/images`, {
      method: "POST",
      body: fd,
    });
  },

  reorderImages: (portfolioId: number, orders: { imageId: number; order: number }[]) =>
    api<PortfolioImage[]>(`/api/admin/portfolios/${portfolioId}/images/order`, {
      method: "PUT",
      body: { orders },
    }),

  setThumbnail: (portfolioId: number, imageId: number) =>
    api<PortfolioImage[]>(`/api/admin/portfolios/${portfolioId}/images/${imageId}/thumbnail`, {
      method: "PUT",
    }),

  deleteImage: (portfolioId: number, imageId: number) =>
    api<void>(`/api/admin/portfolios/${portfolioId}/images/${imageId}`, { method: "DELETE" }),

  // site info
  getSiteInfo: () => api<SiteInfo>("/api/admin/site-info"),

  updateSiteInfo: (input: SiteInfoUpdateInput) =>
    api<SiteInfo>("/api/admin/site-info", { method: "PUT", body: input }),

  uploadHeroImage: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api<SiteInfo>("/api/admin/site-info/hero-image", { method: "POST", body: fd });
  },

  deleteHeroImage: () =>
    api<SiteInfo>("/api/admin/site-info/hero-image", { method: "DELETE" }),

  uploadCategoryHero: (category: Category, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);
    return api<SiteInfo>("/api/admin/site-info/category-hero", { method: "POST", body: fd });
  },

  deleteCategoryHero: (category: Category) =>
    api<SiteInfo>(`/api/admin/site-info/category-hero?category=${category}`, { method: "DELETE" }),
};

export function imageSrc(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}
