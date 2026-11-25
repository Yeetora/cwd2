"use client";

import { useEffect, useState } from "react";
import { findFont, siteFontVars } from "@/lib/fonts";

/**
 * 관리자 "사이트에서 미리보기": 주소에 ?fontHeading=…&fontBody=… 가 있으면
 * 저장하지 않고 이 화면에서만 폰트를 바꿔 보여준다.
 */
export default function FontPreview() {
  const [active, setActive] = useState<{ heading: string; body: string } | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (!sp.has("fontHeading") && !sp.has("fontBody")) return;
    const heading = findFont(sp.get("fontHeading"));
    const body = findFont(sp.get("fontBody"));
    for (const f of [heading, body]) {
      if (f && !document.querySelector(`link[href="${f.css}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = f.css;
        document.head.appendChild(link);
      }
    }
    const root = document.getElementById("site-fonts");
    if (root) {
      for (const [k, v] of Object.entries(siteFontVars(heading, body))) root.style.setProperty(k, String(v));
    }
    // 외부 값(주소창)에 맞춰 표시만 갱신
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive({ heading: heading?.label ?? "기본", body: body?.label ?? "기본" });
  }, []);

  if (!active) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 bg-foreground px-4 py-2.5 text-xs text-background shadow-lg">
      폰트 미리보기 중 · 제목 {active.heading} / 본문 {active.body} · 저장되지 않음
    </div>
  );
}
