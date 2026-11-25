/** 어두운 섹션 상단: 작은 영문(포인트 색) + 큰 영문 제목 + 오른쪽 짧은 문구 + 구분선 */
export default function DarkSectionHeader({
  eyebrow,
  heading,
  tagline,
  children,
}: {
  eyebrow: string;
  heading: string;
  tagline: [string, string];
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-white/15 pb-8 md:pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-medium tracking-[0.25em] text-portfolio-accent md:text-xs">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-light leading-none tracking-tight text-portfolio-frame md:text-6xl">
            {heading}
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-portfolio-frame/70 md:text-right">
          {tagline[0]}
          <br />
          {tagline[1]}
        </p>
      </div>
      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}
