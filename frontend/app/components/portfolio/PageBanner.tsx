import Link from "next/link";
import FadeImage from "./FadeImage";

/** 사진 위 테마색 막 + 가운데 큰 영문 제목, 아래 경로 표시 */
export default function PageBanner({
  imageUrl,
  title,
  sub,
  crumbs,
}: {
  imageUrl: string;
  title: string;
  sub: string;
  crumbs: { label: string; href?: string }[];
}) {
  return (
    <>
      <section className="relative h-[240px] overflow-hidden bg-portfolio-bg md:h-[420px]">
        <FadeImage src={imageUrl} alt="" eager className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-portfolio-veil/65" />
        <div className="relative flex h-full flex-col items-center justify-center px-5 text-center text-portfolio-ink">
          <h1 className="text-4xl font-light tracking-[0.06em] md:text-6xl">{title}</h1>
          <p className="mt-3 text-sm tracking-[0.12em] text-portfolio-ink/70 md:text-base">{sub}</p>
        </div>
      </section>
      <nav aria-label="현재 위치" className="border-b border-border bg-background">
        <ol className="mx-auto flex max-w-6xl items-center justify-end gap-2 px-5 py-5 text-xs text-muted md:px-8">
          {crumbs.map((c, i) => (
            <li key={c.label} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>›</span>}
              {c.href ? (
                <Link href={c.href} className="transition-colors hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span className="text-foreground">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
