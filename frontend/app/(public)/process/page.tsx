import type { Metadata } from "next";

export const metadata: Metadata = { title: "Process" };

const STEPS = [
  { no: "01", title: "상담", desc: "고객의 요구사항과 공간을 이해하기 위한 첫 단계입니다." },
  { no: "02", title: "현장 실측", desc: "현장 방문 후 정확한 치수와 환경을 확인합니다." },
  { no: "03", title: "디자인 제안", desc: "컨셉, 도면, 3D 시안을 제안합니다." },
  { no: "04", title: "계약 및 시공", desc: "확정된 디자인을 바탕으로 시공을 진행합니다." },
  { no: "05", title: "준공 및 A/S", desc: "완료 후 일정 기간 사후 점검을 제공합니다." },
];

export default function ProcessPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20 md:px-8 md:py-28">
      <p className="text-xs tracking-[0.3em] text-muted">PROCESS</p>
      <h1 className="mt-4 text-3xl font-light md:text-4xl">진행 과정</h1>

      <ol className="mt-16 space-y-12 md:space-y-16">
        {STEPS.map((s) => (
          <li key={s.no} className="grid gap-4 border-t border-border pt-8 md:grid-cols-[120px_1fr]">
            <div className="text-3xl font-light text-muted md:text-4xl">{s.no}</div>
            <div>
              <div className="text-xl font-medium">{s.title}</div>
              <p className="mt-3 text-foreground/80 leading-relaxed">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
