import { findFont, siteFontVars } from "@/lib/fonts";
import FontPreview from "./FontPreview";

/**
 * 관리자에서 고른 제목/본문 폰트를 공개 화면에 적용한다.
 * display: contents라 레이아웃에는 영향이 없고, 글꼴 변수만 아래로 물려준다.
 */
export default function SiteFonts({
  fontHeading,
  fontBody,
  children,
}: {
  fontHeading: string | null | undefined;
  fontBody: string | null | undefined;
  children: React.ReactNode;
}) {
  const heading = findFont(fontHeading);
  const body = findFont(fontBody);
  const links = [...new Set([heading?.css, body?.css].filter((c): c is string => Boolean(c)))];
  return (
    <div id="site-fonts" className="site-fonts contents" style={siteFontVars(heading, body)}>
      {links.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}
      <FontPreview />
      {children}
    </div>
  );
}
