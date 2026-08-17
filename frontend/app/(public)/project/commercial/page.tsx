import type { Metadata } from "next";
import Link from "next/link";
import { publicApi } from "@/lib/api/public";
import { imageSrc } from "@/lib/api/admin";

export const metadata: Metadata = { title: "상업공간 | Project" };

type SearchParams = { page?: string };

export default async function CommercialPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 0);
  const data = await publicApi.listPortfolios("COMMERCIAL", page, 12);

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] text-muted">COMMERCIAL</p>
          <h1 className="mt-4 text-3xl font-light md:text-4xl">상업공간</h1>
        </div>
        <Link
          href="/project/residential"
          className="text-sm text-muted hover:text-foreground"
        >
          주거공간 보기 →
        </Link>
      </div>

      {!data || data.items.length === 0 ? (
        <p className="mt-16 text-sm text-muted">등록된 포트폴리오가 없습니다.</p>
      ) : (
        <>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => (
              <Link key={item.id} href={`/project/${item.id}`} className="group block w-4/5 mx-auto">
                <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
                  {item.thumbnailUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={imageSrc(item.thumbnailUrl) ?? ""}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted text-sm">
                      이미지 없음
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-muted">
                    {[item.areaSize, item.location].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            base="/project/commercial"
            current={data.page}
            totalPages={data.totalPages}
          />
        </>
      )}
    </div>
  );
}

function Pagination({
  base,
  current,
  totalPages,
}: {
  base: string;
  current: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-12 flex items-center justify-center gap-2 text-sm">
      <Link
        href={`${base}?page=${Math.max(0, current - 1)}`}
        className={`border border-border px-3 py-1 ${current === 0 ? "pointer-events-none opacity-40" : "hover:bg-neutral-100"}`}
      >
        이전
      </Link>
      <span className="text-muted">
        {current + 1} / {totalPages}
      </span>
      <Link
        href={`${base}?page=${Math.min(totalPages - 1, current + 1)}`}
        className={`border border-border px-3 py-1 ${current >= totalPages - 1 ? "pointer-events-none opacity-40" : "hover:bg-neutral-100"}`}
      >
        다음
      </Link>
    </div>
  );
}
