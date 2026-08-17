import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi } from "@/lib/api/public";
import { imageSrc } from "@/lib/api/admin";

export const metadata: Metadata = { title: "프로젝트 상세 | Project" };

function categoryLabel(c: "RESIDENTIAL" | "COMMERCIAL"): string {
  return c === "RESIDENTIAL" ? "주거공간" : "상업공간";
}

function backHref(c: "RESIDENTIAL" | "COMMERCIAL"): string {
  return c === "RESIDENTIAL" ? "/project/residential" : "/project/commercial";
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const portfolio = await publicApi.getPortfolio(numericId);
  if (!portfolio) notFound();

  const adjacent = await publicApi.getAdjacent(numericId, portfolio.category);

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 md:px-8 md:py-28">
      <Link
        href={backHref(portfolio.category)}
        className="text-xs tracking-[0.2em] text-muted hover:text-foreground"
      >
        ← {categoryLabel(portfolio.category).toUpperCase()}
      </Link>

      <h1 className="mt-6 text-3xl font-light md:text-4xl">{portfolio.title}</h1>

      <dl className="mt-8 grid grid-cols-2 gap-y-3 text-sm md:grid-cols-4">
        <div>
          <dt className="text-xs text-muted">카테고리</dt>
          <dd className="mt-1">{categoryLabel(portfolio.category)}</dd>
        </div>
        {portfolio.location && (
          <div>
            <dt className="text-xs text-muted">위치</dt>
            <dd className="mt-1">{portfolio.location}</dd>
          </div>
        )}
        {portfolio.areaSize && (
          <div>
            <dt className="text-xs text-muted">평수</dt>
            <dd className="mt-1">{portfolio.areaSize}</dd>
          </div>
        )}
        {portfolio.duration && (
          <div>
            <dt className="text-xs text-muted">공사기간</dt>
            <dd className="mt-1">{portfolio.duration}</dd>
          </div>
        )}
      </dl>

      {portfolio.images.length === 0 ? (
        <p className="mt-12 text-sm text-muted">이미지가 아직 등록되지 않았습니다.</p>
      ) : (
        <div className="mt-12 space-y-4">
          {portfolio.images.map((img) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={img.id}
              src={imageSrc(img.url) ?? ""}
              alt={img.originalName ?? portfolio.title}
              className="w-full"
            />
          ))}
        </div>
      )}

      {portfolio.description && (
        <p className="mt-12 max-w-3xl text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {portfolio.description}
        </p>
      )}

      <div className="mt-16 flex justify-between border-t border-border pt-6 text-sm">
        {adjacent?.previous ? (
          <Link href={`/project/${adjacent.previous.id}`} className="text-muted hover:text-foreground">
            ← {adjacent.previous.title}
          </Link>
        ) : (
          <span />
        )}
        {adjacent?.next ? (
          <Link href={`/project/${adjacent.next.id}`} className="text-muted hover:text-foreground">
            {adjacent.next.title} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
