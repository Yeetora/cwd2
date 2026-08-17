"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";

export default function PortfolioRowActions({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm(`"${title}"을(를) 삭제하시겠습니까? 이미지도 함께 삭제됩니다.`)) return;
    setBusy(true);
    try {
      await adminApi.deletePortfolio(id);
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "삭제 실패";
      alert(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/admin/portfolio/${id}`}
        className="border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100"
      >
        편집
      </Link>
      <button
        onClick={onDelete}
        disabled={busy}
        className="border border-red-300 text-red-600 px-2 py-1 text-xs hover:bg-red-50 disabled:opacity-50"
      >
        {busy ? "삭제 중..." : "삭제"}
      </button>
    </div>
  );
}
