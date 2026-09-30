import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { serverApiBase } from "@/lib/api/client";
import type { InquiryListItem, InquiryStatus, PageResponse } from "@/lib/api/types";
import InquiryRow from "./InquiryRow";

export const metadata: Metadata = {
  title: "문의 관리",
  robots: { index: false, follow: false },
};

type SearchParams = { status?: string; page?: string };

const STATUSES: InquiryStatus[] = ["NEW", "CHECKED", "DONE"];

async function fetchList(cookieHeader: string, params: SearchParams): Promise<PageResponse<InquiryListItem> | null> {
  try {
    const sp = new URLSearchParams();
    if (params.status) sp.set("status", params.status);
    sp.set("page", params.page ?? "0");
    sp.set("size", "20");
    const res = await fetch(`${serverApiBase()}/api/admin/inquiries?${sp.toString()}`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as PageResponse<InquiryListItem>;
  } catch {
    return null;
  }
}

export default async function AdminInquiriesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const status = STATUSES.includes(sp.status as InquiryStatus) ? (sp.status as InquiryStatus) : undefined;
  const data = await fetchList(cookieHeader, { ...sp, status });
  const page = Number(sp.page ?? 0);

  return (
    <div>
      <h1 className="text-2xl font-light">문의 관리</h1>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-neutral-500">필터:</span>
        <FilterLink current={status} target={undefined} label="전체" />
        <FilterLink current={status} target="NEW" label="미확인" />
        <FilterLink current={status} target="CHECKED" label="확인됨" />
        <FilterLink current={status} target="DONE" label="처리완료" />
      </div>

      {!data ? (
        <p className="mt-12 text-sm text-red-600">목록을 불러오지 못했습니다.</p>
      ) : data.items.length === 0 ? (
        <p className="mt-12 text-sm text-neutral-500">문의가 없습니다.</p>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200 bg-white">
            {data.items.map((item) => (
              <InquiryRow key={item.id} item={item} />
            ))}
          </ul>
          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              {page > 0 && <PageLink status={status} page={page - 1} label="← 이전" />}
              <span className="text-neutral-500">{page + 1} / {data.totalPages}</span>
              {page + 1 < data.totalPages && <PageLink status={status} page={page + 1} label="다음 →" />}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterLink({ current, target, label }: { current?: InquiryStatus; target?: InquiryStatus; label: string }) {
  const active = current === target;
  return (
    <Link
      href={target ? `/admin/inquiries?status=${target}` : "/admin/inquiries"}
      className={active ? "font-medium underline underline-offset-4" : "text-neutral-600 hover:text-neutral-900"}
    >
      {label}
    </Link>
  );
}

function PageLink({ status, page, label }: { status?: InquiryStatus; page: number; label: string }) {
  const sp = new URLSearchParams();
  if (status) sp.set("status", status);
  sp.set("page", String(page));
  return (
    <Link href={`/admin/inquiries?${sp.toString()}`} className="hover:underline">
      {label}
    </Link>
  );
}
