"use client";

import { useState } from "react";
import Link from "next/link";
import { imageSrc } from "@/lib/api/admin";
import type { PortfolioListItem } from "@/lib/api/types";
import { cardMeta } from "@/lib/portfolio";
import FadeImage from "./FadeImage";
import ProjectModal from "./ProjectModal";

/**
 * 흰 액자 + 사진만 깔끔하게. 이름은 마우스를 올리면(PC) / 처음 터치하면(모바일)
 * 테마색 막과 함께 나타난다. 클릭(모바일은 두 번째 터치)하면 목록 위에 팝업으로 열린다.
 */
export default function FramedPortfolioGrid({ items }: { items: PortfolioListItem[] }) {
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  return (
    <>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <FramedCard
            key={item.id}
            item={item}
            revealed={revealedId === item.id}
            onReveal={() => setRevealedId(item.id)}
            onOpen={() => setOpenId(item.id)}
          />
        ))}
      </div>
      {openId !== null && <ProjectModal key={openId} id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

function FramedCard({
  item,
  revealed,
  onReveal,
  onOpen,
}: {
  item: PortfolioListItem;
  revealed: boolean;
  onReveal: () => void;
  onOpen: () => void;
}) {
  const src = imageSrc(item.thumbnailUrl);
  const meta = cardMeta(item.location, item.areaSize);

  function onClick(e: React.MouseEvent) {
    // Cmd/Ctrl/Shift 클릭은 브라우저 기본 동작(새 탭 등)으로 상세 페이지를 연다
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    // 마우스 hover가 없는 기기(휴대폰·태블릿): 첫 터치는 이름만 보여주고 팝업은 두 번째 터치에
    const touchOnly = window.matchMedia("(hover: none)").matches;
    if (touchOnly && !revealed) onReveal();
    else onOpen();
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
