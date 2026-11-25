import Link from "next/link";
import { imageSrc } from "@/lib/api/admin";
import type { PortfolioListItem } from "@/lib/api/types";
import { cardMeta } from "@/lib/portfolio";
import FadeImage from "./FadeImage";

/** 크림색 액자 + 어둡게 깐 사진 + 가운데 흰 제목 (마우스를 올리면 사진이 밝아짐) */
export default function FramedPortfolioGrid({ items }: { items: PortfolioListItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <FramedCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function FramedCard({ item }: { item: PortfolioListItem }) {
  const src = imageSrc(item.thumbnailUrl);
  const meta = cardMeta(item.location, item.areaSize);
  return (
    <Link
      href={`/project/${item.id}`}
      className="group block border-[5px] border-portfolio-frame bg-portfolio-frame"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#242321]">
        {src && (
          <FadeImage
            src={src}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-0 bg-black/45 transition-colors duration-500 group-hover:bg-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
          <span className="text-[15px] leading-snug [text-shadow:0_1px_6px_rgba(0,0,0,0.35)] md:text-base">
            {item.title}
          </span>
          {meta && (
            <span className="mt-2 text-[11px] tracking-[0.12em] text-white/75 opacity-0 transition-opacity duration-500 group-hover:opacity-100 max-md:opacity-100">
              {meta}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
