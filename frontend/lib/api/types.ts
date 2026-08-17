export type Category = "RESIDENTIAL" | "COMMERCIAL";

export type AdminInfo = {
  id: number;
  username: string;
  email: string;
};

export type PortfolioImage = {
  id: number;
  url: string;
  originalName: string | null;
  displayOrder: number;
  isThumbnail: boolean;
};

export type PortfolioListItem = {
  id: number;
  title: string;
  category: Category;
  location: string | null;
  areaSize: string | null;
  duration: string | null;
  isPublished: boolean;
  createdAt: string;
  thumbnailUrl: string | null;
};

export type PortfolioDetail = {
  id: number;
  title: string;
  category: Category;
  location: string | null;
  areaSize: string | null;
  duration: string | null;
  description: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  images: PortfolioImage[];
};

export type PageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type PortfolioCreateInput = {
  title: string;
  category: Category;
  location?: string | null;
  areaSize?: string | null;
  duration?: string | null;
  description?: string | null;
  isPublished?: boolean;
};

export type PortfolioUpdateInput = Required<Omit<PortfolioCreateInput, "isPublished">> & {
  isPublished: boolean;
};

export type SiteInfo = {
  companyPhone: string | null;
  companyEmail: string | null;
  companyAddress: string | null;
  businessHours: string | null;
  heroImageUrl: string | null;
  residentialHeroUrl: string | null;
  commercialHeroUrl: string | null;
};

export type SiteInfoUpdateInput = {
  companyPhone: string | null;
  companyEmail: string | null;
  companyAddress: string | null;
  businessHours: string | null;
};
