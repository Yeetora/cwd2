/** 관리자에서 고를 수 있는 웹폰트 목록. 키는 백엔드 SiteInfoService.ALLOWED_FONTS와 맞춰야 한다. */
export type FontKind = "sans" | "serif";

export type FontOption = {
  key: string;
  label: string;
  family: string;
  kind: FontKind;
  css: string;
};

const GF = (q: string) => `https://fonts.googleapis.com/css2?family=${q}&display=swap`;

export const FONT_OPTIONS: FontOption[] = [
  {
    key: "pretendard",
    label: "Pretendard",
    family: "Pretendard Variable",
    kind: "sans",
    css: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css",
  },
  { key: "noto-sans-kr", label: "Noto Sans KR", family: "Noto Sans KR", kind: "sans", css: GF("Noto+Sans+KR:wght@300;400;500;700") },
  { key: "ibm-plex-sans-kr", label: "IBM Plex Sans KR", family: "IBM Plex Sans KR", kind: "sans", css: GF("IBM+Plex+Sans+KR:wght@300;400;500;700") },
  { key: "nanum-gothic", label: "나눔고딕", family: "Nanum Gothic", kind: "sans", css: GF("Nanum+Gothic:wght@400;700") },
  { key: "gowun-dodum", label: "고운돋움", family: "Gowun Dodum", kind: "sans", css: GF("Gowun+Dodum") },
  { key: "noto-serif-kr", label: "Noto Serif KR", family: "Noto Serif KR", kind: "serif", css: GF("Noto+Serif+KR:wght@300;400;500;700") },
  { key: "nanum-myeongjo", label: "나눔명조", family: "Nanum Myeongjo", kind: "serif", css: GF("Nanum+Myeongjo:wght@400;700") },
  { key: "gowun-batang", label: "고운바탕", family: "Gowun Batang", kind: "serif", css: GF("Gowun+Batang:wght@400;700") },
  { key: "hahmlet", label: "함렛", family: "Hahmlet", kind: "serif", css: GF("Hahmlet:wght@300;400;500;700") },
];

/** 지금까지 쓰던 기본 글꼴 묶음 (globals.css body와 같음) */
export const DEFAULT_FONT_STACK =
  'var(--font-sans), -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", sans-serif';

export function findFont(key: string | null | undefined): FontOption | null {
  if (!key) return null;
  return FONT_OPTIONS.find((f) => f.key === key) ?? null;
}

export function fontStack(font: FontOption | null): string {
  if (!font) return DEFAULT_FONT_STACK;
  return font.kind === "serif"
    ? `"${font.family}", "AppleMyungjo", "Noto Serif KR", serif`
    : `"${font.family}", ${DEFAULT_FONT_STACK}`;
}

/** 공개 화면에 적용할 CSS 변수 */
export function siteFontVars(heading: FontOption | null, body: FontOption | null): React.CSSProperties {
  return {
    ["--site-font-heading" as string]: fontStack(heading ?? body),
    ["--site-font-body" as string]: fontStack(body),
  };
}
