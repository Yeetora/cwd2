import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/api/public";
import { imageSrc } from "@/lib/api/admin";
import {
  BRAND_EYEBROW,
  CATEGORY_COPY,
  CATEGORY_LABEL,
  CATEGORY_PATH,
  formatArea,
  formatAreaWithM2,
  shortLocation,
} from "@/lib/portfolio";
import PageBanner from "@/app/components/portfolio/PageBanner";
import ProjectGallery, { type GalleryImage } from "@/app/components/portfolio/ProjectGallery";

export const metadata: Metadata = { title: "프로젝트 상세 | Project" };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const portfolio = await publicApi.getPortfolio(numericId);
  if (!portfolio) notFound();

  const adjacent = await publicApi.getAdjacent(numericId, portfolio.category);
  const copy = CATEGORY_COPY[portfolio.category];

  // 배너는 대표 사진을 어둡게 깔아서 쓰고, 갤러리에는 대표 사진까지 모두 밝게 보여준다
  const hero = portfolio.images.find((img) => img.isThumbnail) ?? portfolio.images[0] ?? null;
  const bannerImage = (hero && imageSrc(hero.url)) || "/hero-main.png";
  const gallery: GalleryImage[] = [
    ...(hero ? [hero] : []),
    ...portfolio.images.filter((img) => img.id !== hero?.id),
  ].map((img) => ({ id: img.id, src: imageSrc(img.url) ?? "", alt: portfolio.title }));

  const subline = [shortLocation(portfolio.location), formatArea(portfolio.areaSize)].filter(Boolean).join(" · ");

  const facts = [
    { label: "유형", value: CATEGORY_LABEL[portfolio.category] },
    { label: "위치", value: portfolio.location },
    { label: "면적", value: formatAreaWithM2(portfolio.areaSize) },
    { label: "공사기간", value: portfolio.duration },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  return (
    <div>
      <PageBanner
        imageUrl={bannerImage}
        title={copy.banner}
        sub={copy.sub}
        crumbs={[
          { label: "HOME", href: "/" },
          { label: "PROJECT", href: "/project" },
          { label: CATEGORY_LABEL[portfolio.category], href: CATEGORY_PATH[portfolio.category] },
          { label: portfolio.title },
        ]}
      />

      <section className="bg-portfolio-bg">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <header className="border-b border-portfolio-ink/15 pb-10 md:pb-14">
            <p className="text-[11px] font-medium tracking-[0.25em] text-portfolio-accent md:text-xs">
              {BRAND_EYEBROW} · {copy.banner}
            </p>
            <div className="mt-4 grid gap-10 md:grid-cols-12 md:gap-8">
              <div className="md:col-span-7">
                <h1 className="text-3xl font-light leading-tight text-portfolio-ink md:text-5xl">{portfolio.title}</h1>
                {subline && <p className="mt-4 text-sm tracking-[0.08em] text-portfolio-ink/60">{subline}</p>}
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 self-end md:col-span-5 md:col-start-8">
                {facts.map((f) => (
                  <div key={f.label}>
                    <dt className="text-[11px] tracking-[0.12em] text-portfolio-ink/50">{f.label}</dt>
                    <dd className="mt-1.5 text-sm text-portfolio-ink">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {portfolio.description && (
              <p className="mt-10 max-w-[40rem] whitespace-pre-line text-[15px] leading-[1.9] text-portfolio-ink/75 md:mt-14 md:text-base">
                {portfolio.description}
              </p>
            )}
          </header>

          {gallery.length > 0 ? (
            <div className="mt-12 md:mt-16">
              <ProjectGallery images={gallery} />
            </div>
          ) : (
            <p className="mt-12 text-sm text-portfolio-ink/60">사진이 아직 등록되지 않았습니다.</p>
          )}

          <nav className="mt-20 border-t border-portfolio-ink/15 pt-10 md:mt-28 md:pt-14" aria-label="다른 프로젝트">
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                {adjacent?.previous && (
                  <Link href={`/project/${adjacent.previous.id}`} className="group block">
                    <span className="text-[11px] tracking-[0.25em] text-portfolio-accent">← PREV</span>
                    <span className="mt-3 block text-lg font-light leading-snug text-portfolio-ink/80 transition-colors group-hover:text-portfolio-ink md:text-2xl">
                      {adjacent.previous.title}
                    </span>
                  </Link>
                )}
              </div>
              <div className="md:text-right">
                {adjacent?.next && (
                  <Link href={`/project/${adjacent.next.id}`} className="group block">
                    <span className="text-[11px] tracking-[0.25em] text-portfolio-accent">NEXT →</span>
                    <span className="mt-3 block text-lg font-light leading-snug text-portfolio-ink/80 transition-colors group-hover:text-portfolio-ink md:text-2xl">
                      {adjacent.next.title}
                    </span>
                  </Link>
                )}
              </div>
            </div>
            <div className="mt-16 flex justify-center">
              <Link
                href={CATEGORY_PATH[portfolio.category]}
                className="border border-portfolio-ink/30 px-8 py-3 text-sm tracking-[0.1em] text-portfolio-ink transition-colors hover:border-portfolio-accent hover:bg-portfolio-accent hover:text-white"
              >
                목록으로
              </Link>
            </div>
          </nav>
        </div>
      </section>
    </div>
  );
}
