import type { Metadata } from "next";
import Link from "next/link";
import { publicApi } from "@/lib/api/public";
import { imageSrc } from "@/lib/api/admin";
import type { Category } from "@/lib/api/types";
import { BRAND_EYEBROW, CATEGORY_COPY, CATEGORY_LABEL, CATEGORY_PATH } from "@/lib/portfolio";
import SectionHeader from "@/app/components/portfolio/SectionHeader";
import FadeImage from "@/app/components/portfolio/FadeImage";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectIndexPage() {
  const siteInfo = await publicApi.getSiteInfo();
  const cards: { category: Category; image: string | null }[] = [
    { category: "RESIDENTIAL", image: imageSrc(siteInfo?.residentialHeroUrl ?? null) },
    { category: "COMMERCIAL", image: imageSrc(siteInfo?.commercialHeroUrl ?? null) },
  ];

  return (
    <div>
      <section className="bg-portfolio-bg">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
          <SectionHeader
            eyebrow={`${BRAND_EYEBROW} · PROJECT`}
            heading="OUR WORKS"
            tagline={["주거와 상업, 두 영역에서 완성한", "공간의 기록입니다."]}
          />

          <div className="mt-12 grid grid-cols-1 gap-1.5 md:mt-16 md:grid-cols-2">
            {cards.map(({ category, image }) => (
              <Link
                key={category}
                href={CATEGORY_PATH[category]}
                className="group block border-[5px] border-portfolio-frame bg-portfolio-frame"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-portfolio-veil">
                  {image && (
                    <FadeImage
                      src={image}
                      alt={CATEGORY_LABEL[category]}
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-[1.04]"
                    />
                  )}
                  <div className="absolute inset-0 bg-portfolio-veil/70 transition-colors duration-500 group-hover:bg-portfolio-veil/40" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-portfolio-ink">
                    <span className="text-[11px] tracking-[0.3em] text-portfolio-accent">{CATEGORY_COPY[category].banner}</span>
                    <span className="mt-3 text-2xl font-light md:text-3xl">{CATEGORY_LABEL[category]}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
