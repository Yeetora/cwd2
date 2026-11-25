import Link from "next/link";
import { imageSrc } from "@/lib/api/admin";
import type { PortfolioListItem } from "@/lib/api/types";
import { cardMeta } from "@/lib/portfolio";
import FadeImage from "./FadeImage";

export default function PortfolioGrid({ items }: { items: PortfolioListItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-20">
      {items.map((item) => (
        <PortfolioCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function PortfolioCard({ item }: { item: PortfolioListItem }) {
  const src = imageSrc(item.thumbnailUrl);
  const meta = cardMeta(item.location, item.areaSize);
  return (
    <Link href={`/project/${item.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#eeece8]">
        {src && (
          <FadeImage
            src={src}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover group-hover:scale-[1.03]"
          />
        )}
      </div>
      <h3 className="mt-4 text-[15px] font-normal leading-snug text-foreground md:text-base">{item.title}</h3>
      {meta && <p className="mt-1.5 text-xs tracking-[0.04em] text-muted">{meta}</p>}
    </Link>
  );
}
