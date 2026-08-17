"use client";

import { useRef, useState } from "react";
import type { PortfolioImage } from "@/lib/api/types";
import { adminApi, imageSrc } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";

const MAX_IMAGES = 10;

export default function ImageManager({
  portfolioId,
  initialImages,
}: {
  portfolioId: number;
  initialImages: PortfolioImage[];
}) {
  const [images, setImages] = useState<PortfolioImage[]>([...initialImages].sort((a, b) => a.displayOrder - b.displayOrder));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function clearError() {
    setError(null);
  }

  async function handleSelectFiles(e: React.ChangeEvent<HTMLInputElement>) {
    clearError();
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (images.length + files.length > MAX_IMAGES) {
      setError(`이미지는 최대 ${MAX_IMAGES}장입니다 (현재 ${images.length}장, 추가 ${files.length}장 시도)`);
      e.target.value = "";
      return;
    }
    setBusy(true);
    try {
      const created = await adminApi.uploadImages(portfolioId, files);
      setImages((prev) => [...prev, ...created].sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "업로드 실패");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = images.slice();
    [next[index], next[target]] = [next[target], next[index]];
    const orders = next.map((img, i) => ({ imageId: img.id, order: i }));
    setBusy(true);
    clearError();
    try {
      const updated = await adminApi.reorderImages(portfolioId, orders);
      setImages([...updated].sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "순서 변경 실패");
    } finally {
      setBusy(false);
    }
  }

  async function setAsThumbnail(imageId: number) {
    setBusy(true);
    clearError();
    try {
      const updated = await adminApi.setThumbnail(portfolioId, imageId);
      setImages([...updated].sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "대표 지정 실패");
    } finally {
      setBusy(false);
    }
  }

  async function deleteImage(imageId: number) {
    if (!confirm("이 이미지를 삭제하시겠습니까?")) return;
    setBusy(true);
    clearError();
    try {
      await adminApi.deleteImage(portfolioId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border border-neutral-200 p-6">
      <div className="flex items-center justify-between gap-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleSelectFiles}
          disabled={busy || images.length >= MAX_IMAGES}
          className="text-sm"
        />
        <span className="text-xs text-neutral-500">
          jpg / png / webp, 단일 파일 최대 10MB
        </span>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {images.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">등록된 이미지가 없습니다.</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, idx) => (
            <li key={img.id} className="border border-neutral-200 bg-neutral-50">
              <div className="relative aspect-[4/3] bg-neutral-200">
                {img.isThumbnail && (
                  <span className="absolute left-2 top-2 z-10 bg-foreground text-background text-[10px] tracking-[0.2em] px-2 py-0.5">
                    대표
                  </span>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc(img.url) ?? ""}
                  alt={img.originalName ?? `image-${img.id}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div className="p-3 text-xs">
                <div className="truncate text-neutral-700">{img.originalName ?? `#${img.id}`}</div>
                <div className="mt-1 text-neutral-500">순서 {img.displayOrder}</div>
                <div className="mt-3 flex flex-wrap gap-1">
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={busy || idx === 0}
                    className="border border-neutral-300 px-2 py-1 hover:bg-white disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={busy || idx === images.length - 1}
                    className="border border-neutral-300 px-2 py-1 hover:bg-white disabled:opacity-40"
                  >
                    ↓
                  </button>
                  {!img.isThumbnail && (
                    <button
                      onClick={() => setAsThumbnail(img.id)}
                      disabled={busy}
                      className="border border-neutral-300 px-2 py-1 hover:bg-white disabled:opacity-40"
                    >
                      대표로
                    </button>
                  )}
                  <button
                    onClick={() => deleteImage(img.id)}
                    disabled={busy}
                    className="border border-red-300 text-red-600 px-2 py-1 hover:bg-red-50 disabled:opacity-40 ml-auto"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
