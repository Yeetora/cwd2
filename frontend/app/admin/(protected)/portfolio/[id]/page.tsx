import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { serverApiBase } from "@/lib/api/client";
import type { PortfolioDetail } from "@/lib/api/types";
import PortfolioForm from "../PortfolioForm";
import ImageManager from "./ImageManager";

async function fetchPortfolio(id: number, cookieHeader: string): Promise<PortfolioDetail | null> {
  const res = await fetch(`${serverApiBase()}/api/admin/portfolios/${id}`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return (await res.json()) as PortfolioDetail;
}

export default async function EditPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");
  const portfolio = await fetchPortfolio(numericId, cookieHeader);
  if (!portfolio) notFound();

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light">포트폴리오 편집</h1>
          <p className="mt-1 text-sm text-neutral-500">ID #{portfolio.id}</p>
        </div>
        <Link href="/admin/portfolio" className="text-sm text-neutral-500 hover:underline">
          ← 목록
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-neutral-500 tracking-[0.2em] uppercase">메타데이터</h2>
        <div className="mt-3">
          <PortfolioForm mode="edit" initial={portfolio} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-medium text-neutral-500 tracking-[0.2em] uppercase">
          이미지 ({portfolio.images.length} / 10)
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          첫 업로드 시 자동으로 대표 이미지로 지정됩니다. 이후 변경 가능.
        </p>
        <div className="mt-3">
          <ImageManager portfolioId={portfolio.id} initialImages={portfolio.images} />
        </div>
      </section>
    </div>
  );
}
