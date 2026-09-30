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

// ── 예상 견적 ──────────────────────────────────────

export type Grade = "BASIC" | "STANDARD" | "PREMIUM";
export type DisplayMode = "RANGE" | "SINGLE";
export type PricingType = "PER_PYEONG" | "PER_UNIT" | "FIXED";
export type AppliesTo = "ALL" | "RESIDENTIAL" | "COMMERCIAL";

export type PublicEstimateOption = {
  id: number;
  name: string;
  description: string | null;
  appliesTo: AppliesTo;
  pricingType: PricingType;
  unitLabel: string | null;
};

export type PublicEstimateConfig = {
  enabled: boolean;
  displayMode: DisplayMode;
  notice: string | null;
  categories: { category: Category; grades: { grade: Grade; label: string }[] }[];
  options: PublicEstimateOption[];
};

export type EstimateInput = {
  category: Category;
  grade: Grade;
  areaPyeong: number;
  options: { optionId: number; quantity?: number }[];
};

export type EstimateResult = {
  displayMode: DisplayMode;
  amount: number;
  minAmount: number;
  maxAmount: number;
  notice: string | null;
};

export type EstimateOption = PublicEstimateOption & {
  unitPrice: number;
  active: boolean;
  displayOrder: number;
};

export type EstimateOptionInput = {
  name: string;
  description: string | null;
  appliesTo: AppliesTo;
  pricingType: PricingType;
  unitPrice: number;
  unitLabel: string | null;
  active: boolean;
  displayOrder?: number | null;
};

export type BaseRate = {
  category: Category;
  grade: Grade;
  pricePerPyeong: number | null;
};

export type EstimateSettings = {
  enabled: boolean;
  displayMode: DisplayMode;
  rangePercent: number;
  minimumAmount: number | null;
  notice: string | null;
};

export type AdminEstimateConfig = {
  settings: EstimateSettings;
  rates: BaseRate[];
  options: EstimateOption[];
};

// ── 문의 ──────────────────────────────────────────

export type InquiryStatus = "NEW" | "CHECKED" | "DONE";

export type InquiryCreateInput = {
  name: string;
  phone: string;
  email: string | null;
  content: string;
  privacyAgreed: boolean;
  estimate: EstimateInput | null;
  website: string;
};

export type InquiryListItem = {
  id: number;
  name: string;
  phone: string;
  status: InquiryStatus;
  hasEstimate: boolean;
  estimateAmount: number | null;
  createdAt: string;
};

export type InquiryDetail = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  content: string;
  status: InquiryStatus;
  createdAt: string;
  estimate: {
    category: Category;
    grade: Grade;
    areaPyeong: number;
    amount: number;
    minAmount: number;
    maxAmount: number;
    detail: string;
  } | null;
};
