import Link from "next/link";
import { publicApi } from "@/lib/api/public";
import type { Category } from "@/lib/api/types";
import { CATEGORY_LABEL, CATEGORY_PATH } from "@/lib/portfolio";
import PortfolioGrid from "./PortfolioGrid";

const PAGE_SIZE = 12;

export default async function CategoryListPage({ category, page }: { category: Category; page: number }) {
  const data = await publicApi.listPortfolios(category, page, PAGE_SIZE);
  const other: Category = category === "RESIDENTIAL" ? "COMMERCIAL" : "RESIDENTIAL";

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28 lg:px-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs tracking-[0.3em] text-muted">{category}</p>
          <h1 className="mt-4 text-3xl font-light md:text-4xl">{CATEGORY_LABEL[category]}</h1>
        </div>
        <nav className="flex items-center gap-6 text-sm" aria-label="카테고리">
          <span className="border-b border-foreground pb-1 text-foreground">{CATEGORY_LABEL[category]}</span>
          <Link
            href={CATEGORY_PATH[other]}
            className="border-b border-transparent pb-1 text-muted transition-colors duration-300 hover:text-foreground"
          >
            {CATEGORY_LABEL[other]}
          </Link>
        </nav>
      </div>

      {!data || data.items.length === 0 ? (
        <p className="mt-16 text-sm text-muted">등록된 포트폴리오가 없습니다.</p>
      ) : (
        <>
          <div className="mt-14 md:mt-20">
            <PortfolioGrid items={data.items} />
          </div>
          <Pagination base={CATEGORY_PATH[category]} current={data.page} totalPages={data.totalPages} />
        </>
      )}
    </div>
  );
}

function Pagination({ base, current, totalPages }: { base: string; current: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-20 flex items-center justify-center gap-6 text-sm text-muted" aria-label="페이지">
      {Array.from({ length: totalPages }, (_, i) => (
        <Link
          key={i}
          href={i === 0 ? base : `${base}?page=${i}`}
          aria-current={i === current ? "page" : undefined}
          className={
            i === current
              ? "border-b border-foreground pb-1 text-foreground"
              : "border-b border-transparent pb-1 transition-colors hover:text-foreground"
          }
        >
          {String(i + 1).padStart(2, "0")}
        </Link>
      ))}
    </nav>
  );
}
