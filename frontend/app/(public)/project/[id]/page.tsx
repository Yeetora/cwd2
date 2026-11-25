import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/api/public";
import { imageSrc } from "@/lib/api/admin";
import { CATEGORY_LABEL, CATEGORY_PATH, formatAreaWithM2 } from "@/lib/portfolio";
import FadeImage from "@/app/components/portfolio/FadeImage";
import ProjectGallery, { type GalleryImage } from "@/app/components/portfolio/ProjectGallery";

export const metadata: Metadata = { title: "프로젝트 상세 | Project" };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const portfolio = await publicApi.getPortfolio(numericId);
  if (!portfolio) notFound();

  const adjacent = await publicApi.getAdjacent(numericId, portfolio.category);

  // 대표 이미지를 맨 위 큰 사진으로, 나머지는 아래 갤러리로
  const hero = portfolio.images.find((img) => img.isThumbnail) ?? portfolio.images[0] ?? null;
  const gallery: GalleryImage[] = portfolio.images
    .filter((img) => img.id !== hero?.id)
    .map((img) => ({ id: img.id, src: imageSrc(img.url) ?? "", alt: portfolio.title }));
  const heroSrc = hero ? imageSrc(hero.url) : null;

  const facts = [
    { label: "유형", value: CATEGORY_LABEL[portfolio.category] },
    { label: "위치", value: portfolio.location },
    { label: "면적", value: formatAreaWithM2(portfolio.areaSize) },
    { label: "공사기간", value: portfolio.duration },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  const container = "mx-auto max-w-[1440px] px-5 md:px-10 lg:px-16";

  return (
    <article className="pb-24 md:pb-32">
      <div className={`${container} pt-10 md:pt-14`}>
        <Link
          href={CATEGORY_PATH[portfolio.category]}
          className="text-xs tracking-[0.2em] text-muted transition-colors hover:text-foreground"
        >
          ← {CATEGORY_LABEL[portfolio.category]}
        </Link>
      </div>

      {heroSrc && (
        <div className="mx-auto mt-6 max-w-[1440px] md:mt-8 md:px-10 lg:px-16">
          <div className="relative aspect-[4/5] max-h-[90vh] w-full overflow-hidden bg-[#eeece8] md:aspect-[3/2]">
            <FadeImage src={heroSrc} alt={portfolio.title} eager className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div>
      )}

      <header className={`${container} mt-14 md:mt-24`}>
        <p className="text-xs tracking-[0.3em] text-muted">{portfolio.category}</p>
        <h1 className="mt-4 max-w-4xl text-3xl font-light leading-tight md:text-[40px]">{portfolio.title}</h1>

        <div className="mt-12 grid gap-12 md:mt-16 md:grid-cols-12 md:gap-10">
          <dl
            className={
              portfolio.description
                ? "grid grid-cols-2 gap-x-6 gap-y-6 md:col-span-4 md:grid-cols-1 lg:col-span-3"
                : "grid grid-cols-2 gap-x-6 gap-y-6 md:col-span-12 md:grid-cols-4 lg:col-span-9"
            }
          >
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="text-xs tracking-[0.08em] text-muted">{f.label}</dt>
                <dd className="mt-1.5 text-sm text-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>
          {portfolio.description && (
            <div className="md:col-span-8 lg:col-span-7 lg:col-start-5">
              <p className="max-w-[38rem] whitespace-pre-line text-[15px] leading-[1.9] text-foreground/85 md:text-base">
                {portfolio.description}
              </p>
            </div>
          )}
        </div>
      </header>

      {gallery.length > 0 && (
        <section className={`${container} mt-20 md:mt-28`} aria-label="프로젝트 사진">
          <ProjectGallery images={gallery} />
        </section>
      )}

      <nav className={`${container} mt-28 md:mt-40`} aria-label="다른 프로젝트">
        <div className="grid gap-10 border-t border-border pt-10 md:grid-cols-2 md:pt-14">
          <div>
            {adjacent?.previous && (
              <Link href={`/project/${adjacent.previous.id}`} className="group block">
                <span className="text-xs tracking-[0.2em] text-muted">← 이전 프로젝트</span>
                <span className="mt-3 block text-lg font-light leading-snug transition-colors group-hover:text-muted md:text-2xl">
                  {adjacent.previous.title}
                </span>
              </Link>
            )}
          </div>
          <div className="md:text-right">
            {adjacent?.next && (
              <Link href={`/project/${adjacent.next.id}`} className="group block">
                <span className="text-xs tracking-[0.2em] text-muted">다음 프로젝트 →</span>
                <span className="mt-3 block text-lg font-light leading-snug transition-colors group-hover:text-muted md:text-2xl">
                  {adjacent.next.title}
                </span>
              </Link>
            )}
          </div>
        </div>
        <div className="mt-16 text-center">
          <Link
            href={CATEGORY_PATH[portfolio.category]}
            className="border-b border-foreground/30 pb-1 text-sm text-muted transition-colors hover:border-foreground hover:text-foreground"
          >
            목록으로
          </Link>
        </div>
      </nav>
    </article>
  );
}
