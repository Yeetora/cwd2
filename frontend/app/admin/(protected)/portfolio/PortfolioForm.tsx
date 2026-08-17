"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Category, PortfolioDetail } from "@/lib/api/types";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";

const MAX_INITIAL_IMAGES = 10;

type Props =
  | { mode: "create"; initial?: undefined }
  | { mode: "edit"; initial: PortfolioDetail };

export default function PortfolioForm({ mode, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "RESIDENTIAL");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [areaSize, setAreaSize] = useState(initial?.areaSize ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialFiles, setInitialFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function onSelectFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (files.length > MAX_INITIAL_IMAGES) {
      setError(`이미지는 한 번에 최대 ${MAX_INITIAL_IMAGES}장까지 선택 가능합니다.`);
      e.target.value = "";
      return;
    }
    setInitialFiles(files);
  }

  function removeFile(index: number) {
    setInitialFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "create") {
        const created = await adminApi.createPortfolio({
          title,
          category,
          location: location || null,
          areaSize: areaSize || null,
          duration: duration || null,
          description: description || null,
          isPublished,
        });
        // 등록 직후 선택된 이미지가 있으면 이어서 업로드
        if (initialFiles.length > 0) {
          try {
            await adminApi.uploadImages(created.id, initialFiles);
          } catch (uploadErr) {
            // 메타데이터는 이미 저장됨. 편집 페이지에서 다시 시도 가능.
            const msg = uploadErr instanceof ApiError ? uploadErr.message : "이미지 업로드 실패";
            setError(`포트폴리오는 등록됐으나 이미지 업로드 실패: ${msg}. 편집 페이지에서 다시 시도하세요.`);
          }
        }
        router.replace(`/admin/portfolio/${created.id}`);
        router.refresh();
      } else {
        await adminApi.updatePortfolio(initial!.id, {
          title,
          category,
          location: location || "",
          areaSize: areaSize || "",
          duration: duration || "",
          description: description || "",
          isPublished,
        });
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "저장 실패";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 max-w-2xl bg-white border border-neutral-200 p-6">
      <Field label="제목" required>
        <input
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
        />
      </Field>

      <Field label="카테고리" required>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="input"
        >
          <option value="RESIDENTIAL">주거공간</option>
          <option value="COMMERCIAL">상업공간</option>
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="위치">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="서울 강남구"
            className="input"
          />
        </Field>
        <Field label="평수">
          <input
            type="text"
            value={areaSize}
            onChange={(e) => setAreaSize(e.target.value)}
            placeholder="32평"
            className="input"
          />
        </Field>
        <Field label="공사기간">
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="3주"
            className="input"
          />
        </Field>
      </div>

      <Field label="설명">
        <textarea
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        공개
      </label>

      {mode === "create" && (
        <Field label={`초기 이미지 (선택, 최대 ${MAX_INITIAL_IMAGES}장)`}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={onSelectFiles}
            disabled={busy}
            className="text-sm"
          />
          {initialFiles.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {initialFiles.map((f, idx) => (
                <li key={`${f.name}-${idx}`} className="relative border border-neutral-200 p-2 text-xs">
                  <div className="truncate">{f.name}</div>
                  <div className="text-neutral-500">{(f.size / 1024).toFixed(0)} KB</div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    disabled={busy}
                    className="absolute top-1 right-1 text-red-600 text-xs hover:underline"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-neutral-500">
            첫 번째 이미지가 자동으로 대표 이미지로 지정됩니다. 등록 후에도 편집 페이지에서 추가 업로드 가능합니다.
          </p>
        </Field>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="border border-foreground bg-foreground text-background px-6 py-2 text-sm hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "저장 중..." : mode === "create" ? "등록" : "저장"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-neutral-300 px-6 py-2 text-sm hover:bg-neutral-100"
        >
          취소
        </button>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border: 1px solid rgb(212 212 212);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        :global(.input:focus) {
          border-color: var(--foreground);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs tracking-[0.2em] text-neutral-500">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
