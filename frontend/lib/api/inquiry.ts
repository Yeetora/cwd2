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

/** 원 → "4,870만 원" / "35.5만 원" / "1억 2,300만 원" / "5,000원" */
export function formatWon(amount: number): string {
  if (amount < 10_000) return `${amount.toLocaleString("ko-KR")}원`;
  const man = Math.round(amount / 1_000) / 10;
  const eok = Math.floor(man / 10_000);
  const rest = Math.round((man - eok * 10_000) * 10) / 10;
  const fmt = (n: number) => n.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
  if (eok > 0) {
    return rest > 0 ? `${eok}억 ${fmt(rest)}만 원` : `${eok}억 원`;
  }
  return `${fmt(man)}만 원`;
}

export const GRADE_LABEL = { BASIC: "기본", STANDARD: "중급", PREMIUM: "고급" } as const;
export const CATEGORY_LABEL = { RESIDENTIAL: "주거공간", COMMERCIAL: "상업공간" } as const;
