"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FadeImage from "./FadeImage";

export type GalleryImage = { id: number; src: string; alt: string };

type Row =
  | { kind: "full"; index: number }
  | { kind: "pair"; indexes: [number, number] }
  | { kind: "single"; index: number; align: "left" | "right" };

/**
 * 사진 방향에 따라 리듬 있게 배치한다.
 * - 가로 사진: 전체 폭
 * - 세로 사진 두 장 연속: 나란히
 * - 남는 세로 사진 한 장: 좌우를 번갈아 가며 화면 폭의 절반 정도로
 * 사진 크기를 알기 전에는 순서대로 쌓아 두었다가, 크기를 읽으면 다시 배치한다.
 */
function buildRows(portrait: (boolean | undefined)[]): Row[] {
  const rows: Row[] = [];
  let singleFlip = false;
  for (let i = 0; i < portrait.length; i++) {
    if (portrait[i] && portrait[i + 1]) {
      rows.push({ kind: "pair", indexes: [i, i + 1] });
      i++;
    } else if (portrait[i]) {
      rows.push({ kind: "single", index: i, align: singleFlip ? "right" : "left" });
      singleFlip = !singleFlip;
    } else {
      rows.push({ kind: "full", index: i });
    }
  }
  return rows;
}

export default function ProjectGallery({ images }: { images: GalleryImage[] }) {
  const [portrait, setPortrait] = useState<(boolean | undefined)[]>(() => images.map(() => undefined));
  const [open, setOpen] = useState<number | null>(null);

  const [timedOut, setTimedOut] = useState(false);

  // 사진 크기를 미리 읽어 배치를 정한다 (브라우저 캐시를 쓰므로 실제 표시 때 다시 받지 않음)
  useEffect(() => {
    let cancelled = false;
    const record = (i: number, value: boolean) => {
      if (cancelled) return;
      setPortrait((prev) => {
        const next = [...prev];
        next[i] = value;
        return next;
      });
    };
    images.forEach((img, i) => {
      const probe = new Image();
      probe.onload = () => record(i, probe.naturalHeight > probe.naturalWidth * 1.05);
      probe.onerror = () => record(i, false);
      probe.src = img.src;
    });
    // 느린 사진 때문에 갤러리가 계속 숨어 있지 않도록, 일정 시간이 지나면 아는 만큼으로 배치
    const timer = setTimeout(() => !cancelled && setTimedOut(true), 4000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [images]);

  const ready = timedOut || portrait.every((p) => p !== undefined);
  const rows = useMemo(
    () => buildRows(ready ? portrait.map((p) => p ?? false) : images.map(() => false)),
    [ready, portrait, images]
  );

  if (images.length === 0) return null;

  const photo = (index: number) => (
    <Photo key={images[index].id} image={images[index]} index={index} onOpen={setOpen} />
  );

  return (
    <>
      <div className={`space-y-1.5 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}>
        {rows.map((row, r) => {
          if (row.kind === "full") return <div key={r}>{photo(row.index)}</div>;
          if (row.kind === "pair") {
            return (
              <div key={r} className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {photo(row.indexes[0])}
                {photo(row.indexes[1])}
              </div>
            );
          }
          return (
            <div key={r} className={`flex ${row.align === "right" ? "sm:justify-end" : "sm:justify-start"}`}>
              <div className="w-full sm:w-[58%]">{photo(row.index)}</div>
            </div>
          );
        })}
      </div>

      {open !== null && <Lightbox images={images} index={open} onChange={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}

function Photo({
  image,
  index,
  onOpen,
}: {
  image: GalleryImage;
  index: number;
  onOpen: (i: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className="group block w-full cursor-zoom-in border-[5px] border-portfolio-frame bg-portfolio-frame"
      aria-label={`사진 ${index + 1} 크게 보기`}
    >
      <span className="block overflow-hidden">
        <FadeImage src={image.src} alt={image.alt} className="block h-auto w-full group-hover:scale-[1.02]" />
      </span>
    </button>
  );
}

function Lightbox({
  images,
  index,
  onChange,
  onClose,
}: {
  images: GalleryImage[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
}) {
  const total = images.length;
  const go = useCallback((delta: number) => onChange((index + delta + total) % total), [index, total, onChange]);
  const touchX = useRef<number | null>(null);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 크게 보기"
      className="fixed inset-0 z-[60] flex flex-col bg-[#141413] text-white/80"
      onClick={onClose}
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
      <div className="flex items-center justify-between px-5 py-4 text-xs tracking-[0.2em] md:px-8">
        <span>
          {index + 1} / {total}
        </span>
        <button type="button" onClick={onClose} className="p-2 text-base hover:text-white" aria-label="닫기">
          ✕
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-8 md:px-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={images[index].src}
          src={images[index].src}
          alt={images[index].alt}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full object-contain"
        />
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 p-4 text-2xl font-light hover:text-white md:block"
              aria-label="이전 사진"
            >
              ←
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 p-4 text-2xl font-light hover:text-white md:block"
              aria-label="다음 사진"
            >
              →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
