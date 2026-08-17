import Link from "next/link";
import { cookies } from "next/headers";
import { serverApiBase } from "@/lib/api/client";
import type { Category, PageResponse, PortfolioListItem } from "@/lib/api/types";
import { imageSrc } from "@/lib/api/admin";
import PortfolioRowActions from "./PortfolioRowActions";

type SearchParams = { category?: string; page?: string; size?: string };

async function fetchList(
  cookieHeader: string,
  params: SearchParams
): Promise<PageResponse<PortfolioListItem> | null> {
  try {
    const sp = new URLSearchParams();
    if (params.category) sp.set("category", params.category);
    sp.set("page", params.page ?? "0");
    sp.set("size", params.size ?? "20");
    const res = await fetch(`${serverApiBase()}/api/admin/portfolios?${sp.toString()}`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as PageResponse<PortfolioListItem>;
  } catch {
    return null;
  }
}

export default async function AdminPortfolioListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const data = await fetchList(cookieHeader, sp);

  const category = (sp.category as Category | undefined) ?? null;
  const page = Number(sp.page ?? 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-light">포트폴리오 관리</h1>
        <Link
          href="/admin/portfolio/new"
          className="border border-foreground bg-foreground text-background px-4 py-2 text-sm hover:opacity-90"
        >
          + 신규 등록
        </Link>
      </div>

      <div className="mt-6 flex items-center gap-3 text-sm">
        <span className="text-neutral-500">필터:</span>
        <CategoryLink current={category} target={null} label="전체" />
        <CategoryLink current={category} target="RESIDENTIAL" label="주거공간" />
        <CategoryLink current={category} target="COMMERCIAL" label="상업공간" />
      </div>

      {!data ? (
        <p className="mt-12 text-sm text-red-600">목록을 불러오지 못했습니다.</p>
      ) : data.items.length === 0 ? (
        <p className="mt-12 text-sm text-neutral-500">등록된 포트폴리오가 없습니다.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-neutral-100 text-left">
              <tr>
                <th className="px-3 py-2 w-20">썸네일</th>
                <th className="px-3 py-2">제목</th>
                <th className="px-3 py-2 w-28">카테고리</th>
                <th className="px-3 py-2 w-24">공개</th>
                <th className="px-3 py-2 w-40">등록일</th>
                <th className="px-3 py-2 w-32 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                  <td className="px-3 py-2">
                    {item.thumbnailUrl ? (
                      <img
                        src={imageSrc(item.thumbnailUrl) ?? ""}
                        alt=""
                        className="h-12 w-16 object-cover"
                      />
                    ) : (
                      <div className="h-12 w-16 bg-neutral-200 flex items-center justify-center text-[10px] text-neutral-500">
                        없음
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/portfolio/${item.id}`}
                      className="hover:underline"
                    >
                      {item.title}
                    </Link>
                    <div className="text-xs text-neutral-500">
                      {[item.location, item.areaSize, item.duration].filter(Boolean).join(" · ")}
                    </div>
                  </td>
                  <td className="px-3 py-2">{categoryLabel(item.category)}</td>
                  <td className="px-3 py-2">
                    {item.isPublished ? (
                      <span className="inline-block px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700">공개</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-xs bg-neutral-200 text-neutral-600">비공개</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-500">
                    {new Date(item.createdAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <PortfolioRowActions id={item.id} title={item.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-neutral-500">총 {data.totalElements}개</div>
            <Pagination current={page} totalPages={data.totalPages} category={category} />
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryLink({
  current,
  target,
  label,
}: {
  current: Category | null;
  target: Category | null;
  label: string;
}) {
  const active = current === target;
  const href = target ? `/admin/portfolio?category=${target}` : "/admin/portfolio";
  return (
    <Link
      href={href}
      className={
        "border px-3 py-1 " +
        (active
          ? "bg-foreground text-background border-foreground"
          : "border-neutral-300 hover:bg-neutral-100")
      }
    >
      {label}
    </Link>
  );
}

function Pagination({
  current,
  totalPages,
  category,
}: {
  current: number;
  totalPages: number;
  category: Category | null;
}) {
  if (totalPages <= 1) return null;
  const link = (p: number) => {
    const sp = new URLSearchParams();
    if (category) sp.set("category", category);
    sp.set("page", String(p));
    return `/admin/portfolio?${sp.toString()}`;
  };
  return (
    <div className="flex items-center gap-2">
      <Link
        href={link(Math.max(0, current - 1))}
        className={`border px-3 py-1 ${current === 0 ? "pointer-events-none opacity-40" : "hover:bg-neutral-100"}`}
      >
        이전
      </Link>
      <span className="text-neutral-500">
        {current + 1} / {totalPages}
      </span>
      <Link
        href={link(Math.min(totalPages - 1, current + 1))}
        className={`border px-3 py-1 ${current >= totalPages - 1 ? "pointer-events-none opacity-40" : "hover:bg-neutral-100"}`}
      >
        다음
      </Link>
    </div>
  );
}

function categoryLabel(c: Category): string {
  return c === "RESIDENTIAL" ? "주거공간" : "상업공간";
}
