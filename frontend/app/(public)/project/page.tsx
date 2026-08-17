import type { Metadata } from "next";
import Link from "next/link";
import { publicApi } from "@/lib/api/public";
import { imageSrc } from "@/lib/api/admin";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectIndexPage() {
  const siteInfo = await publicApi.getSiteInfo();
  const residentialBg = imageSrc(siteInfo?.residentialHeroUrl ?? null);
  const commercialBg = imageSrc(siteInfo?.commercialHeroUrl ?? null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
      <p className="text-xs tracking-[0.3em] text-muted">PROJECT</p>
      <h1 className="mt-4 text-3xl font-light md:text-4xl">포트폴리오</h1>
      <p className="mt-4 max-w-2xl text-muted">
        주거와 상업, 두 영역에서 진행한 프로젝트들을 확인하실 수 있습니다.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <CategoryCard
          href="/project/residential"
          label="RESIDENTIAL"
          title="주거공간"
          bgUrl={residentialBg}
        />
        <CategoryCard
          href="/project/commercial"
          label="COMMERCIAL"
          title="상업공간"
          bgUrl={commercialBg}
        />
      </div>
    </div>
  );
}

function CategoryCard({
  href,
  label,
  title,
  bgUrl,
}: {
  href: string;
  label: string;
  title: string;
  bgUrl: string | null;
}) {
  return (
    <Link
      href={href}
      className="group relative aspect-[4/3] overflow-hidden bg-neutral-100"
    >
      {bgUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={bgUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      {/* 텍스트 가독성을 위한 옅은 어두운 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-start justify-end p-8 text-white">
        <div className="text-xs tracking-[0.2em] opacity-90">{label}</div>
        <div className="mt-2 text-2xl font-light md:text-3xl">{title} →</div>
      </div>
    </Link>
  );
}
