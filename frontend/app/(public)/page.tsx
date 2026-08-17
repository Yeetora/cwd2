import Link from "next/link";
import { publicApi } from "@/lib/api/public";
import { imageSrc } from "@/lib/api/admin";

export default async function HomePage() {
  const [residential, commercial, siteInfo] = await Promise.all([
    publicApi.listPortfolios("RESIDENTIAL", 0, 3),
    publicApi.listPortfolios("COMMERCIAL", 0, 3),
    publicApi.getSiteInfo(),
  ]);

  // 백엔드에 등록된 히어로 이미지 우선, 없으면 기본 정적 이미지
  // S3면 절대 URL이라 그대로, 로컬 저장이면 imageSrc로 절대화
  const heroSrc = imageSrc(siteInfo?.heroImageUrl ?? null) ?? "/hero-main.png";

  const featured = [
    ...(residential?.items ?? []),
    ...(commercial?.items ?? []),
  ].slice(0, 6);

  return (
    <div>
      <section className="relative overflow-hidden bg-surface-warm">
        {/* 동적 히어로 이미지: 관리자 페이지에서 업로드한 이미지가 있으면 사용. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* 상단: 헤더(베이지)에서 이미지로 자연스럽게 페이드 */}
        <div className="absolute inset-x-0 top-0 h-56 md:h-72 bg-gradient-to-b from-surface-warm via-surface-warm/60 to-transparent" />
        {/* 좌측: 텍스트 가독성을 위한 옅은 베이지 스크림 */}
        <div className="absolute inset-0 bg-gradient-to-r from-surface-warm/50 via-surface-warm/10 to-transparent" />
        {/* 하단: 본문(흰색)으로 페이드 */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white" />

        <div className="relative mx-auto max-w-7xl px-4 py-32 md:px-8 md:py-56">
          <p className="text-xs font-medium tracking-[0.3em] text-foreground/70 [text-shadow:0_1px_2px_rgba(245,239,229,0.6)]">
            CHAEUDA BY DESIGN
          </p>
          <h1 className="mt-6 text-4xl font-medium leading-tight tracking-tight text-foreground md:text-6xl [text-shadow:0_2px_8px_rgba(245,239,229,0.5)]">
            공간에 담기는
            <br />
            절제된 감성
          </h1>
          <p className="mt-8 max-w-xl text-base font-normal text-foreground/90 md:text-lg [text-shadow:0_1px_3px_rgba(245,239,229,0.5)]">
            화려하지 않지만 세련된 공간, 디테일한 감성을 살린 디자인.
            <br />
            주거와 상업 공간 모두에 어울리는 인테리어를 제안합니다.
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
            <Link
              href="/project/residential"
              className="group inline-flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors"
            >
              <span className="border-b border-foreground/40 pb-1 transition-colors group-hover:border-foreground">
                주거공간 보기
              </span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/project/commercial"
              className="group inline-flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors"
            >
              <span className="border-b border-foreground/40 pb-1 transition-colors group-hover:border-foreground">
                상업공간 보기
              </span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-light md:text-3xl">Featured Projects</h2>
          <Link href="/project" className="text-sm text-muted hover:text-foreground">
            전체보기 →
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="mt-8 text-sm text-muted">아직 등록된 프로젝트가 없습니다.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
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
        )}
      </section>
    </div>
  );
}
