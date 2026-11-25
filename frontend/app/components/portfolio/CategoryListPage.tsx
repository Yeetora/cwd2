import Link from "next/link";
import { publicApi } from "@/lib/api/public";
import { imageSrc } from "@/lib/api/admin";
import type { Category } from "@/lib/api/types";
import { BRAND_EYEBROW, CATEGORY_COPY, CATEGORY_LABEL, CATEGORY_PATH } from "@/lib/portfolio";
import PageBanner from "./PageBanner";
import SectionHeader from "./SectionHeader";
import FramedPortfolioGrid from "./FramedPortfolioGrid";

const PAGE_SIZE = 12;

export default async function CategoryListPage({ category, page }: { category: Category; page: number }) {
  const [data, siteInfo] = await Promise.all([
    publicApi.listPortfolios(category, page, PAGE_SIZE),
    publicApi.getSiteInfo(),
  ]);
  const copy = CATEGORY_COPY[category];
  const categoryHero = category === "RESIDENTIAL" ? siteInfo?.residentialHeroUrl : siteInfo?.commercialHeroUrl;
  const bannerImage = imageSrc(categoryHero ?? siteInfo?.heroImageUrl ?? null) ?? "/hero-main.png";

  return (
    <div>
      <PageBanner
        imageUrl={bannerImage}
        title={copy.banner}
        sub={copy.sub}
        crumbs={[{ label: "HOME", href: "/" }, { label: "PROJECT", href: "/project" }, { label: CATEGORY_LABEL[category] }]}
      />

      <section className="bg-portfolio-bg">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <SectionHeader eyebrow={`${BRAND_EYEBROW} · ${copy.banner}`} heading={copy.heading} tagline={copy.tagline}>
            <CategoryTabs current={category} />
          </SectionHeader>

          {!data || data.items.length === 0 ? (
            <p className="mt-16 text-sm text-portfolio-ink/60">등록된 포트폴리오가 없습니다.</p>
          ) : (
            <>
              <div className="mt-12 md:mt-16">
                <FramedPortfolioGrid items={data.items} />
              </div>
              <Pagination base={CATEGORY_PATH[category]} current={data.page} totalPages={data.totalPages} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function CategoryTabs({ current }: { current: Category }) {
  const cats: Category[] = ["RESIDENTIAL", "COMMERCIAL"];
  return (
    <nav className="flex items-center gap-8 text-sm" aria-label="카테고리">
      {cats.map((c) => (
        <Link
          key={c}
          href={CATEGORY_PATH[c]}
          aria-current={c === current ? "page" : undefined}
          className={
            c === current
              ? "border-b border-portfolio-accent pb-1 text-portfolio-ink"
              : "border-b border-transparent pb-1 text-portfolio-ink/55 transition-colors hover:text-portfolio-ink"
          }
        >
          {CATEGORY_LABEL[c]}
        </Link>
      ))}
    </nav>
  );
}

function Pagination({ base, current, totalPages }: { base: string; current: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const href = (i: number) => (i === 0 ? base : `${base}?page=${i}`);
  return (
    <nav className="mt-16 flex items-center justify-center gap-2 text-sm" aria-label="페이지">
      <PageArrow href={href(Math.max(0, current - 1))} disabled={current === 0} label="이전 페이지">
        ‹
      </PageArrow>
      {Array.from({ length: totalPages }, (_, i) => (
        <Link
          key={i}
          href={href(i)}
          aria-current={i === current ? "page" : undefined}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
            i === current
              ? "bg-portfolio-accent font-medium text-white"
              : "text-portfolio-ink/60 hover:text-portfolio-ink"
          }`}
        >
          {i + 1}
        </Link>
      ))}
      <PageArrow href={href(Math.min(totalPages - 1, current + 1))} disabled={current >= totalPages - 1} label="다음 페이지">
        ›
      </PageArrow>
    </nav>
  );
}

function PageArrow({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center text-lg text-portfolio-ink/60 ${
        disabled ? "pointer-events-none opacity-30" : "hover:text-portfolio-ink"
      }`}
    >
      {children}
    </Link>
  );
}
