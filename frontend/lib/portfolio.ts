import type { Category } from "./api/types";

const PYEONG_TO_M2 = 3.3058;

/** 포트폴리오 섹션 상단 작은 영문 표기 (예: "CHAEUDA · RESIDENTIAL") */
export const BRAND_EYEBROW = "ARTY";

/** 카테고리별 배너·제목 문구 */
export const CATEGORY_COPY: Record<Category, { banner: string; sub: string; heading: string; tagline: [string, string] }> = {
  RESIDENTIAL: {
    banner: "RESIDENTIAL",
    sub: "Homes We've Shaped",
    heading: "HOMES WE SHAPED",
    tagline: ["머무는 사람의 일상에 맞춰 완성한", "주거 공간의 기록입니다."],
  },
  COMMERCIAL: {
    banner: "COMMERCIAL",
    sub: "Spaces We've Created",
    heading: "SPACES WE CREATED",
    tagline: ["브랜드의 분위기를 공간으로 옮긴", "상업 공간의 기록입니다."],
  },
};

export const CATEGORY_LABEL: Record<Category, string> = {
  RESIDENTIAL: "주거공간",
  COMMERCIAL: "상업공간",
};

export const CATEGORY_PATH: Record<Category, string> = {
  RESIDENTIAL: "/project/residential",
  COMMERCIAL: "/project/commercial",
};

/** "34" / "34평" / "34py" → 34, 숫자가 아니면 null */
function pyeongNumber(areaSize: string | null): number | null {
  if (!areaSize) return null;
  const m = areaSize.trim().match(/^(\d+(?:\.\d+)?)\s*(평|py|PY)?$/);
  return m ? Number(m[1]) : null;
}

/** 목록용: "34평". 형식을 알 수 없으면 입력값 그대로 */
export function formatArea(areaSize: string | null): string | null {
  if (!areaSize) return null;
  const n = pyeongNumber(areaSize);
  return n == null ? areaSize.trim() : `${n}평`;
}

/** 상세용: "112㎡ (34평)" */
export function formatAreaWithM2(areaSize: string | null): string | null {
  const n = pyeongNumber(areaSize);
  if (n == null) return formatArea(areaSize);
  return `${Math.round(n * PYEONG_TO_M2)}㎡ (${n}평)`;
}

/** "경기 광명시" → "광명", "서울 강남구" → "강남" — 목록의 짧은 위치 표기 */
export function shortLocation(location: string | null): string | null {
  if (!location) return null;
  const parts = location.trim().split(/\s+/);
  const last = parts[parts.length - 1];
  const short = last.replace(/(특별시|광역시|시|군|구)$/, "");
  return short || last;
}

/** 목록 카드 아래 한 줄: "광명 · 34평" */
export function cardMeta(location: string | null, areaSize: string | null): string {
  return [shortLocation(location), formatArea(areaSize)].filter(Boolean).join(" · ");
}
