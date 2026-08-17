import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 md:px-8 md:py-28">
      <p className="text-xs tracking-[0.3em] text-muted">ABOUT US</p>
      <h1 className="mt-4 text-3xl font-light md:text-4xl">우리의 이야기</h1>

      <div className="mt-12 space-y-8 text-base leading-relaxed text-foreground/90">
        <p>
          INTERIOR STUDIO는 공간이 가진 본연의 가치를 끌어올리는 디자인을 추구합니다.
          과한 장식 대신, 사용자의 일상에 자연스럽게 스며드는 공간을 만듭니다.
        </p>
        <p>
          주거공간에서는 거주자의 라이프스타일을, 상업공간에서는 브랜드의 정체성을
          최우선으로 두고 설계합니다.
        </p>
      </div>

      <div className="mt-16 grid gap-8 border-t border-border pt-12 md:grid-cols-2">
        <div>
          <div className="text-xs tracking-[0.2em] text-muted">PHILOSOPHY</div>
          <p className="mt-4 text-lg font-light">
            절제된 디테일이 만들어내는 깊이 있는 공간.
          </p>
        </div>
        <div>
          <div className="text-xs tracking-[0.2em] text-muted">SERVICE</div>
          <ul className="mt-4 space-y-1 text-foreground/80">
            <li>주거공간 인테리어</li>
            <li>상업공간 인테리어</li>
            <li>리모델링 컨설팅</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
