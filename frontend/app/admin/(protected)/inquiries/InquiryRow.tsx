"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { formatWon } from "@/lib/api/inquiry";
import type { InquiryDetail, InquiryListItem, InquiryStatus } from "@/lib/api/types";

const STATUS_LABEL: Record<InquiryStatus, string> = { NEW: "미확인", CHECKED: "확인됨", DONE: "처리완료" };
const STATUS_CLS: Record<InquiryStatus, string> = {
  NEW: "bg-amber-100 text-amber-800",
  CHECKED: "bg-sky-100 text-sky-800",
  DONE: "bg-neutral-200 text-neutral-600",
};

export default function InquiryRow({ item }: { item: InquiryListItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<InquiryDetail | null>(null);
  const [status, setStatus] = useState<InquiryStatus>(item.status);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !detail) {
      try {
        const d = await adminApi.getInquiry(item.id);
        setDetail(d);
        // 처음 열어본 미확인 문의는 확인됨으로 표시
        if (d.status === "NEW") await changeStatus("CHECKED");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "불러오기 실패");
      }
    }
  }

  async function changeStatus(s: InquiryStatus) {
    setError(null);
    try {
      const d = await adminApi.updateInquiryStatus(item.id, s);
      setDetail(d);
      setStatus(d.status);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "상태 변경 실패");
    }
  }

  async function onDelete() {
    if (!confirm(`${item.name}님의 문의를 삭제하시겠습니까?`)) return;
    try {
      await adminApi.deleteInquiry(item.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "삭제 실패");
    }
  }

  return (
    <li>
      <button type="button" onClick={toggle} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left text-sm hover:bg-neutral-50">
        <span className={`px-2 py-0.5 text-xs ${STATUS_CLS[status]}`}>{STATUS_LABEL[status]}</span>
        <span className="font-medium">{item.name}</span>
        <span className="text-neutral-600">{item.phone}</span>
        {item.estimateAmount != null && (
          <span className="text-xs text-neutral-600">견적 약 {formatWon(item.estimateAmount)}</span>
        )}
        <span className="ml-auto text-xs text-neutral-500">{new Date(item.createdAt).toLocaleString("ko-KR")}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-neutral-100 bg-neutral-50 px-4 py-4 text-sm">
          {error && <p className="text-red-600">{error}</p>}
          {!detail ? (
            !error && <p className="text-neutral-500">불러오는 중...</p>
          ) : (
            <>
              <dl className="grid gap-x-6 gap-y-1 md:grid-cols-[80px_1fr]">
                <dt className="text-neutral-500">연락처</dt>
                <dd>{detail.phone}</dd>
                <dt className="text-neutral-500">이메일</dt>
                <dd>{detail.email ?? "-"}</dd>
                <dt className="text-neutral-500">내용</dt>
                <dd className="whitespace-pre-line">{detail.content || "-"}</dd>
              </dl>

              {detail.estimate && (
                <div className="border border-neutral-200 bg-white p-4">
                  <p className="text-xs tracking-[0.1em] text-neutral-500">예상 견적 (신청 당시)</p>
                  <p className="mt-1 text-base">
                    {formatWon(detail.estimate.amount)}
                    {detail.estimate.minAmount !== detail.estimate.maxAmount && (
                      <span className="ml-2 text-xs text-neutral-500">
                        범위 {formatWon(detail.estimate.minAmount)} ~ {formatWon(detail.estimate.maxAmount)}
                      </span>
                    )}
                  </p>
                  <pre className="mt-3 whitespace-pre-wrap font-sans text-xs leading-relaxed text-neutral-700">{detail.estimate.detail}</pre>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-neutral-500">상태:</span>
                {(Object.keys(STATUS_LABEL) as InquiryStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => changeStatus(s)}
                    disabled={s === status}
                    className={`border px-3 py-1 text-xs ${s === status ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:bg-white"}`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
                <button type="button" onClick={onDelete} className="ml-auto text-xs text-red-600 hover:underline">
                  삭제
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </li>
  );
}
