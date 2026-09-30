import { api } from "./client";
import type { EstimateInput, EstimateResult, InquiryCreateInput } from "./types";

/** 브라우저에서 호출하는 공개 API (견적 계산, 문의 접수) */
export const inquiryApi = {
  calculateEstimate: (input: EstimateInput) =>
    api<EstimateResult>("/api/estimate/calculate", { method: "POST", body: input }),

  create: (input: InquiryCreateInput) =>
    api<{ id: number | null; estimate: EstimateResult | null }>("/api/inquiries", {
      method: "POST",
      body: input,
    }),
};

/** 원 → "4,870만 원" / "1억 2,300만 원" */
export function formatWon(amount: number): string {
  const man = Math.round(amount / 10_000);
  const eok = Math.floor(man / 10_000);
  const rest = man % 10_000;
  if (eok > 0) {
    return rest > 0 ? `${eok}억 ${rest.toLocaleString("ko-KR")}만 원` : `${eok}억 원`;
  }
  return `${man.toLocaleString("ko-KR")}만 원`;
}

export const GRADE_LABEL = { BASIC: "기본", STANDARD: "중급", PREMIUM: "고급" } as const;
export const CATEGORY_LABEL = { RESIDENTIAL: "주거공간", COMMERCIAL: "상업공간" } as const;
