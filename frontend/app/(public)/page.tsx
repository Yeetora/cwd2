import Link from "next/link";
import { publicApi } from "@/lib/api/public";
import { imageSrc } from "@/lib/api/admin";
import PortfolioGrid from "@/app/components/portfolio/PortfolioGrid";

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
      <section className="relative overflow-hidden bg-surface-alt">
        {/* 동적 히어로 이미지: 관리자 페이지에서 업로드한 이미지가 있으면 사용. */}
        {/* 모바일: 세로로 긴 화면에서 잘리거나 글자와 겹치지 않도록 이미지 전체를 글자 위에 표시 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroSrc} alt="" className="block h-auto w-full md:hidden" />
        {/* PC·태블릿: 글자 뒤 배경 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSrc}
          alt=""
          className="absolute inset-0 hidden h-full w-full object-cover md:block"
        />
        {/* 상단: 헤더에서 이미지로 자연스럽게 페이드 */}
        <div className="absolute inset-x-0 top-0 hidden h-72 bg-gradient-to-b from-surface-alt via-surface-alt/60 to-transparent md:block" />
        {/* 좌측: 텍스트 가독성을 위한 옅은 스크림 */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-surface-alt/50 via-surface-alt/10 to-transparent md:block" />
        {/* 하단: 본문(흰색)으로 페이드 */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white" />

        <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-24 md:px-8 md:py-56">
          <p className="text-xs font-medium tracking-[0.3em] text-foreground/70 [text-shadow:0_1px_2px_rgba(238,236,231,0.6)]">
            SPACE, CRAFTED AS ART
          </p>
          <h1 className="mt-6 text-4xl font-medium leading-tight tracking-tight text-foreground md:text-6xl [text-shadow:0_2px_8px_rgba(238,236,231,0.5)]">
            빛과 소재로
            <br />
            완성하는 공간
          </h1>
          <p className="mt-8 max-w-xl text-base font-normal text-foreground/90 md:text-lg [text-shadow:0_1px_3px_rgba(238,236,231,0.5)]">
            머무는 사람의 일상에서 출발해, 빛과 소재의 균형을 설계합니다.
            <br />
            집부터 상업 공간까지, 오래 머물고 싶은 한 장면을 만듭니다.
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

      <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28 lg:px-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-light md:text-3xl">Featured Projects</h2>
          <Link href="/project" className="text-sm text-muted hover:text-foreground">
            전체보기 →
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="mt-8 text-sm text-muted">아직 등록된 프로젝트가 없습니다.</p>
        ) : (
          <div className="mt-10 md:mt-14">
            <PortfolioGrid items={featured} />
          </div>
        )}
      </section>
    </div>
  );
}
