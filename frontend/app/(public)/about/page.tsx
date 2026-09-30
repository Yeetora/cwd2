import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 md:px-8 md:py-28">
      <p className="text-xs tracking-[0.3em] text-muted">ABOUT ARTY</p>
      <h1 className="mt-4 text-3xl font-light leading-snug md:text-4xl">
        공간을 한 점의 작품처럼
      </h1>

      <div className="mt-12 space-y-8 text-base leading-relaxed text-foreground/90">
        <p>
          ARTY INTERIOR는 머무는 사람의 하루에서 출발합니다.
          빛이 어느 방향에서 들어오는지, 손끝에 닿는 소재가 어떤 온도를 가졌는지,
          사람의 움직임이 어떻게 흐르는지를 먼저 살핀 뒤 공간을 그립니다.
        </p>
        <p>
          화려한 장식보다 빛과 소재의 균형을 믿습니다.
          오래 보아도 질리지 않고, 시간이 지날수록 자연스럽게 깊어지는 공간을 만듭니다.
        </p>
        <p>
          주거공간에서는 가족이 살아가는 방식을, 상업공간에서는 브랜드가 전하고 싶은 분위기를
          기준으로 삼아 설계부터 시공까지 세심하게 이어갑니다.
        </p>
      </div>

      <div className="mt-16 grid gap-10 border-t border-border pt-12 md:grid-cols-3">
        <div>
          <div className="text-xs tracking-[0.2em] text-muted">PHILOSOPHY</div>
          <p className="mt-4 text-lg font-light leading-snug">
            빛과 소재, 그리고 여백.
          </p>
        </div>
        <div>
          <div className="text-xs tracking-[0.2em] text-muted">APPROACH</div>
          <ul className="mt-4 space-y-1 text-foreground/80">
            <li>일상을 먼저 듣는 상담</li>
            <li>현장에 맞춘 디자인 제안</li>
            <li>마감까지 이어지는 시공</li>
          </ul>
        </div>
        <div>
          <div className="text-xs tracking-[0.2em] text-muted">SERVICE</div>
          <ul className="mt-4 space-y-1 text-foreground/80">
            <li>주거공간 인테리어</li>
            <li>상업공간 인테리어</li>
            <li>부분 리모델링</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
