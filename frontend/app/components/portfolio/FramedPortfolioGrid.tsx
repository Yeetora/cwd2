"use client";

import { useState } from "react";
import Link from "next/link";
import { imageSrc } from "@/lib/api/admin";
import type { PortfolioListItem } from "@/lib/api/types";
import { cardMeta } from "@/lib/portfolio";
import FadeImage from "./FadeImage";

/**
 * 흰 액자 + 사진만 깔끔하게. 이름은 마우스를 올리면(PC) / 처음 터치하면(모바일)
 * 테마색 막과 함께 나타나고, 모바일에선 한 번 더 터치해야 상세로 이동한다.
 */
export default function FramedPortfolioGrid({ items }: { items: PortfolioListItem[] }) {
  const [revealedId, setRevealedId] = useState<number | null>(null);
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <FramedCard
          key={item.id}
          item={item}
          revealed={revealedId === item.id}
          onReveal={() => setRevealedId(item.id)}
        />
      ))}
    </div>
  );
}

function FramedCard({
  item,
  revealed,
  onReveal,
}: {
  item: PortfolioListItem;
  revealed: boolean;
  onReveal: () => void;
}) {
  const src = imageSrc(item.thumbnailUrl);
  const meta = cardMeta(item.location, item.areaSize);

  function onClick(e: React.MouseEvent) {
    // 마우스 hover가 없는 기기(휴대폰·태블릿): 첫 터치는 이름만 보여주고 이동하지 않음
    const touchOnly = window.matchMedia("(hover: none)").matches;
    if (touchOnly && !revealed) {
      e.preventDefault();
      onReveal();
    }
  }

  return (
    <Link
      href={`/project/${item.id}`}
      onClick={onClick}
      aria-label={item.title}
      className="group block border-[5px] border-portfolio-frame bg-portfolio-frame outline-none"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-portfolio-veil">
        {src && (
          <FadeImage
            src={src}
            alt={item.title}
            className={`absolute inset-0 h-full w-full object-cover group-hover:scale-[1.04] ${revealed ? "scale-[1.04]" : ""}`}
          />
        )}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center bg-portfolio-veil/80 px-6 text-center text-portfolio-ink backdrop-blur-[2px] transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 ${
            revealed ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="text-[15px] leading-snug md:text-base">{item.title}</span>
          {meta && <span className="mt-2 text-[11px] tracking-[0.12em] text-portfolio-ink/60">{meta}</span>}
          <span className="mt-4 text-[10px] tracking-[0.3em] text-portfolio-accent md:hidden">VIEW →</span>
        </div>
      </div>
    </Link>
  );
}
