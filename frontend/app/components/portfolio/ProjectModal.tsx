"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { publicApi } from "@/lib/api/public";
import { imageSrc } from "@/lib/api/admin";
import type { PortfolioDetail } from "@/lib/api/types";
import { CATEGORY_COPY, formatArea, shortLocation } from "@/lib/portfolio";

/**
 * 목록 위에 뜨는 프로젝트 팝업: 큰 사진 + 좌우 이동 + "1 / 6" + 이름·정보 + 썸네일 줄.
 * 사진 크게 보기와 같은 조작(방향키·스와이프·Esc)을 지원한다.
 */
export default function ProjectModal({ id, onClose }: { id: number; onClose: () => void }) {
  const [detail, setDetail] = useState<PortfolioDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 프로젝트마다 key로 새로 마운트되므로 상태 초기화는 필요 없다
    let cancelled = false;
    publicApi
      .getPortfolio(id)
      .then((d) => {
        if (cancelled) return;
        if (d) setDetail(d);
        else setFailed(true);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // 대표 사진을 맨 앞에, 나머지는 등록 순서대로
  const images = useMemo(
    () =>
      detail
        ? [
            ...detail.images.filter((i) => i.isThumbnail),
            ...detail.images.filter((i) => !i.isThumbnail).sort((a, b) => a.displayOrder - b.displayOrder),
          ].map((i) => imageSrc(i.url) ?? "")
        : [],
    [detail]
  );
  const total = images.length;

  const go = useCallback((delta: number) => total > 0 && setIndex((i) => (i + delta + total) % total), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [go, onClose]);

  // 현재 썸네일이 보이도록 썸네일 줄을 스크롤
  useEffect(() => {
    const el = thumbsRef.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);

  // 다음 사진 미리 받아두기
  useEffect(() => {
    if (total > 1) new Image().src = images[(index + 1) % total];
  }, [index, total, images]);

  const meta = detail
    ? [shortLocation(detail.location), formatArea(detail.areaSize), detail.duration].filter(Boolean).join(" · ")
    : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={detail?.title ?? "프로젝트"}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-portfolio-ink/60 p-0 backdrop-blur-sm md:p-8"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-full w-full max-w-5xl flex-col overflow-y-auto bg-portfolio-bg px-4 pb-6 pt-14 shadow-[0_20px_60px_rgba(0,0,0,0.25)] md:px-9 md:pb-8 md:pt-9"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-0 top-0 z-10 flex h-12 w-12 items-center justify-center bg-portfolio-accent text-xl text-white transition-opacity hover:opacity-85"
        >
          ✕
        </button>

        {failed ? (
          <p className="py-24 text-center text-sm text-portfolio-ink/60">프로젝트를 불러오지 못했습니다.</p>
        ) : !detail ? (
          <div className="aspect-[3/2] w-full animate-pulse bg-portfolio-ink/5" />
        ) : (
          <>
            {/* 사진 */}
            <div
              className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-portfolio-ink/[0.06] sm:aspect-[3/2]"
              onTouchStart={(e) => {
                touchX.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (touchX.current == null) return;
                const dx = e.changedTouches[0].clientX - touchX.current;
                if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
                touchX.current = null;
              }}
            >
              {total > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={images[index]} src={images[index]} alt={detail.title} className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-sm text-portfolio-ink/50">사진이 아직 등록되지 않았습니다.</span>
              )}
              {total > 1 && (
                <>
                  <NavButton side="left" onClick={() => go(-1)} />
                  <NavButton side="right" onClick={() => go(1)} />
                  <span className="absolute bottom-3 right-3 bg-portfolio-ink/70 px-2.5 py-1 text-[11px] tracking-[0.1em] text-white">
                    {index + 1} / {total}
                  </span>
                </>
              )}
            </div>

            {/* 이름·정보 */}
            <div className="mt-6 flex flex-col gap-2 border-b border-portfolio-ink/15 pb-5 md:mt-7 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-light leading-snug text-portfolio-ink md:text-3xl">{detail.title}</h2>
                {meta && <p className="mt-2 text-sm tracking-[0.04em] text-portfolio-ink/60">{meta}</p>}
              </div>
              <div className="flex items-center gap-5 md:flex-col md:items-end md:gap-2">
                <span className="text-[11px] font-medium tracking-[0.2em] text-portfolio-accent">
                  {CATEGORY_COPY[detail.category].banner} INTERIOR
                </span>
                <Link
                  href={`/project/${detail.id}`}
                  className="text-xs text-portfolio-ink/55 underline-offset-4 transition-colors hover:text-portfolio-ink hover:underline"
                >
                  상세 페이지 →
                </Link>
              </div>
            </div>

            {detail.description && (
              <p className="mt-5 max-w-[42rem] whitespace-pre-line text-sm leading-[1.85] text-portfolio-ink/75">
                {detail.description}
              </p>
            )}

            {/* 썸네일 줄 */}
            {total > 1 && (
              <div ref={thumbsRef} className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`사진 ${i + 1}`}
                    aria-current={i === index}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden border-2 transition-opacity md:h-20 md:w-[7.5rem] ${
                      i === index ? "border-portfolio-accent opacity-100" : "border-transparent opacity-55 hover:opacity-90"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={side === "left" ? "이전 사진" : "다음 사진"}
      className={`absolute top-1/2 flex h-14 w-11 -translate-y-1/2 items-center justify-center bg-portfolio-bg/80 text-xl text-portfolio-ink transition-colors hover:bg-portfolio-bg ${
        side === "left" ? "left-0" : "right-0"
      }`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}
